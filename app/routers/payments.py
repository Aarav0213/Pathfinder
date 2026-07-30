import os
import stripe
import traceback
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from pydantic import BaseModel

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter(prefix="/payments", tags=["payments"])


def _meta_get(obj, key, default=None):
    """Read a field off a Stripe metadata object safely.

    The installed stripe SDK's StripeObject does not implement a real
    .get() method -- calling .get(...) on it raises AttributeError('get').
    getattr() with a default sidesteps that entirely.
    """
    if obj is None:
        return default
    try:
        return getattr(obj, key)
    except AttributeError:
        return default


class CheckoutRequest(BaseModel):
    success_url: str = "http://localhost:5173/upgrade?success=true"
    cancel_url: str = "http://localhost:5173/upgrade?canceled=true"

class ConfirmCheckoutRequest(BaseModel):
    session_id: str

@router.post("/create-checkout")
def create_checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": 1000,
                    "recurring": {"interval": "month"},
                    "product_data": {
                        "name": "Pathfinder Pro",
                        "description": "AI cover letters, resume tailoring, company watchlists, and more.",
                    },
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url=payload.success_url + "&session_id={CHECKOUT_SESSION_ID}",
            cancel_url=payload.cancel_url,
            customer_email=current_user.email,
            metadata={"user_id": str(current_user.id)},
            subscription_data={"metadata": {"user_id": str(current_user.id)}},
        )
        return {"url": session.url}
    except Exception as e:
        print("CREATE CHECKOUT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/confirm-session")
def confirm_session(
    payload: ConfirmCheckoutRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        session = stripe.checkout.Session.retrieve(payload.session_id)

        metadata_user_id = int(_meta_get(session.metadata, "user_id", 0) or 0)
        if metadata_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Checkout session does not belong to this user")

        if session.status != "complete":
            raise HTTPException(status_code=400, detail="Checkout session is not complete")

        customer_id = session.customer

        current_user.is_premium = 1
        current_user.stripe_customer_id = customer_id
        db.commit()
        db.refresh(current_user)

        return {
            "ok": True,
            "is_premium": current_user.is_premium,
            "stripe_customer_id": current_user.stripe_customer_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        print("=" * 60)
        print("CONFIRM SESSION ERROR:", repr(e))
        traceback.print_exc()
        print("=" * 60)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-portal")
def create_portal(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found")
    try:
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url="http://localhost:5173/upgrade",
        )
        return {"url": session.url}
    except Exception as e:
        print("CREATE PORTAL ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        if WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
        else:
            import json
            event = json.loads(payload)
    except Exception as e:
        print("WEBHOOK ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(_meta_get(session.metadata, "user_id", 0) or 0)
        customer_id = session.customer

        if user_id:
            user = db.get(User, user_id)
            if user:
                user.is_premium = 1
                user.stripe_customer_id = customer_id
                db.commit()
                print("Stripe webhook upgraded user " + str(user_id) + " to Pro")

    elif event["type"] == "customer.subscription.created":
        subscription = event["data"]["object"]
        user_id = int(_meta_get(subscription.metadata, "user_id", 0) or 0)
        customer_id = subscription.customer

        if user_id:
            user = db.get(User, user_id)
            if user:
                user.is_premium = 1
                user.stripe_customer_id = customer_id
                db.commit()
                print("Stripe subscription created: upgraded user " + str(user_id) + " to Pro")

    elif event["type"] == "invoice.paid":
        invoice = event["data"]["object"]
        customer_id = invoice.customer

        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.is_premium = 1
                db.commit()
                print("Stripe invoice paid: confirmed Pro for user " + str(user.id))

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.customer

        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                user.is_premium = 0
                db.commit()
                print("Stripe subscription deleted: downgraded user " + str(user.id))

    return {"ok": True}