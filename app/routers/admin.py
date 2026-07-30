from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.schemas import UserResponse
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user

class AdminStats(BaseModel):
    total_users: int
    total_jobs: int
    total_applications: int
    premium_users: int
    jobs_by_source: dict

class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    is_premium: Optional[int] = None

@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), admin=Depends(require_admin)):
    total_users = db.query(User).count()
    total_jobs = db.query(Job).count()
    total_applications = db.query(Application).count()
    premium_users = db.query(User).filter(User.is_premium == 1).count()
    rows = db.query(Job.source, func.count(Job.id)).group_by(Job.source).all()
    jobs_by_source = {(r[0] or "recruiter"): r[1] for r in rows}
    return AdminStats(
        total_users=total_users,
        total_jobs=total_jobs,
        total_applications=total_applications,
        premium_users=premium_users,
        jobs_by_source=jobs_by_source,
    )

@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(User).order_by(User.id).all()

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role is not None:
        user.role = payload.role
    if payload.is_premium is not None:
        user.is_premium = payload.is_premium
    db.commit()
    db.refresh(user)
    return user
