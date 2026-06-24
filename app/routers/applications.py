from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate
from app.services.application_service import ApplicationService


router = APIRouter(prefix="/applications", tags=["applications"])
application_service = ApplicationService()


@router.get("/me", response_model=list[ApplicationResponse])
def get_my_applications(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return application_service.get_user_applications(db, current_user)


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
    application = application_service.get_application_for_user(db, application_id, current_user)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application_service.update_application_status(db, application, payload)
