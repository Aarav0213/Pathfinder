from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate, ApplicationAnalytics, RecruiterApplicationResponse
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

@router.get("/job/{job_id}", response_model=list[RecruiterApplicationResponse])
def get_applications_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return application_service.get_applications_for_recruiter_job(db, job_id, current_user.id)

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
