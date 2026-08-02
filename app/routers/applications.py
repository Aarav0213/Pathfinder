from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate, ApplicationAnalytics, RecruiterApplicationResponse, CustomApplicationCreate
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])
application_service = ApplicationService()

VALID_STATUSES = {"applied", "reviewing", "interview", "offer", "rejected"}

@router.get("/me", response_model=list[ApplicationResponse])
def get_my_applications(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return application_service.get_user_applications(db, current_user)

@router.get("/analytics", response_model=ApplicationAnalytics)
def get_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    apps = application_service.get_user_applications(db, current_user)
    total = len(apps)
    counts = {"applied": 0, "reviewing": 0, "interview": 0, "offer": 0, "rejected": 0}
    for a in apps:
        if a.status in counts:
            counts[a.status] += 1
    responded = counts["reviewing"] + counts["interview"] + counts["offer"] + counts["rejected"]
    response_rate = round((responded / total * 100), 1) if total > 0 else 0.0
    return ApplicationAnalytics(total=total, response_rate=response_rate, **counts)

@router.get("/job/{job_id}", response_model=list[RecruiterApplicationResponse, CustomApplicationCreate])
def get_applications_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return application_service.get_applications_for_recruiter_job(db, job_id, current_user.id)

@router.post("/custom", response_model=ApplicationResponse)
def create_custom_application(
    payload: CustomApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from datetime import datetime, timezone
    import hashlib
    import time
    from app.models.job import Job
    from app.models.application import Application

    title = payload.title.strip()
    company = payload.company.strip()
    location = (payload.location or "Remote").strip()
    description = payload.description.strip()
    apply_url = (payload.apply_url or "").strip() or None

    if len(description) < 20:
        raise HTTPException(status_code=400, detail="Job description is too short")

    dedup_hash = hashlib.md5(
        (str(current_user.id) + "|" + title + "|" + company + "|" + str(time.time())).encode()
    ).hexdigest()

    job = Job(
        title=title,
        company=company,
        location=location,
        description=description,
        apply_url=apply_url,
        source="custom",
        ai_tags=None,
        dedup_hash=dedup_hash,
        employment_type="CUSTOM",
        user_id=current_user.id,
        posted_at=datetime.now(timezone.utc),
    )

    db.add(job)
    db.flush()

    application = Application(
        user_id=current_user.id,
        job_id=job.id,
        resume_text=current_user.resume_text or "",
        status="applied",
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "id": application.id,
        "user_id": application.user_id,
        "job_id": application.job_id,
        "resume_text": application.resume_text,
        "status": application.status,
        "created_at": application.created_at,
        "job_title": job.title,
        "job_company": job.company,
    }
@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    application = application_service.get_application_for_user(db, application_id, current_user)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application

@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    application = application_service.get_application_for_user(db, application_id, current_user)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application_service.update_application_status(db, application, payload)

