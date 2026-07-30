from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.job import Job
from app.models.saved_job import SavedJob
from app.models.application import Application
from app.schemas import JobResponse
from sqlalchemy import or_

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("", response_model=list[JobResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    saved = db.query(SavedJob).filter(SavedJob.user_id == current_user.id).all()
    applied = db.query(Application).filter(Application.user_id == current_user.id).all()

    seen_job_ids = set()
    keywords = set()

    for s in saved:
        seen_job_ids.add(s.job_id)
        job = db.get(Job, s.job_id)
        if job:
            for word in job.title.lower().split():
                if len(word) > 3:
                    keywords.add(word)
            for word in job.company.lower().split():
                if len(word) > 3:
                    keywords.add(word)

    for a in applied:
        seen_job_ids.add(a.job_id)
        job = db.get(Job, a.job_id)
        if job:
            for word in job.title.lower().split():
                if len(word) > 3:
                    keywords.add(word)

    if not keywords:
        return db.query(Job).order_by(Job.posted_at.desc()).limit(5).all()

    keywords = list(keywords)[:10]
    conditions = []
    for kw in keywords:
        conditions.append(Job.title.ilike("%" + kw + "%"))
        conditions.append(Job.description.ilike("%" + kw + "%"))

    results = (
        db.query(Job)
        .filter(or_(*conditions))
        .filter(Job.id.notin_(seen_job_ids) if seen_job_ids else True)
        .order_by(Job.posted_at.desc())
        .limit(5)
        .all()
    )

    if len(results) < 3:
        results = db.query(Job).order_by(Job.posted_at.desc()).limit(5).all()

    return results
