from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import WatchlistCreate, WatchlistResponse
from app.models.watchlist import Watchlist

router = APIRouter(prefix="/watchlist", tags=["watchlist"])

@router.get("", response_model=list[WatchlistResponse])
def get_watchlist(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()

@router.post("", response_model=WatchlistResponse)
def add_to_watchlist(
    payload: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.company == payload.company
    ).first()
    if existing:
        return existing
    entry = Watchlist(user_id=current_user.id, company=payload.company)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{watchlist_id}")
def remove_from_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry = db.query(Watchlist).filter(
        Watchlist.id == watchlist_id,
        Watchlist.user_id == current_user.id
    ).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"ok": True}
