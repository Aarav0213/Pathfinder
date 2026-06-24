from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas import ApplicationCreate, ApplicationStatusUpdate

ALLOWED_STATUSES = {"applied", "reviewing", "rejected", "accepted"}


class ApplicationService:
    def create_application(self, db: Session, user: User, job_id: int, payload: ApplicationCreate):
        job = db.get(Job, job_id)
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        existing = (
            db.query(Application)
            .filter(Application.user_id == user.id, Application.job_id == job_id)
            .first()
        )
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application already exists")

        application = Application(
            user_id=user.id,
            job_id=job_id,
            resume_text=payload.resume_text,
            status="applied",
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        return application

    def get_user_applications(self, db: Session, user: User):
        return db.query(Application).filter(Application.user_id == user.id).all()

    def get_application_for_user(self, db: Session, application_id: int, user: User):
        return (
            db.query(Application)
            .filter(Application.id == application_id, Application.user_id == user.id)
            .first()
        )

    def update_application_status(self, db: Session, application: Application, payload: ApplicationStatusUpdate):
        if payload.status not in ALLOWED_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
        application.status = payload.status
        db.commit()
        db.refresh(application)
        return application
