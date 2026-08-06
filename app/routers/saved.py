from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import SavedJobResponse
from app.models.saved_job import SavedJob
from app.models.job import Job

router = APIRouter(prefix="/saved", tags=["saved"])

@router.get("", response_model=list[SavedJobResponse])
def get_saved(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(SavedJob).filter(SavedJob.user_id == current_user.id).all()

# Removed response_model=SavedJobResponse here to prevent Pydantic 500 crash on missing Job relationship
@router.post("/{job_id}")
def save_job(job_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    existing = db.query(SavedJob).filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id).first()
    if existing:
        return {"id": existing.id, "job_id": existing.job_id, "user_id": existing.user_id}
        
    saved = SavedJob(user_id=current_user.id, job_id=job_id)
    db.add(saved)
    db.commit()
    
    return {"id": saved.id, "job_id": saved.job_id, "user_id": saved.user_id}

@router.delete("/{job_id}")
def unsave_job(job_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    saved = db.query(SavedJob).filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id).first()
    if saved:
        db.delete(saved)
        db.commit()
    return {"ok": True}
