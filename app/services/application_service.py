from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas import ApplicationCreate, ApplicationStatusUpdate

ALLOWED_STATUSES = {"applied", "reviewing", "interview", "offer", "rejected", "accepted"}

class ApplicationService:
    def create_application(self, db: Session, user: User, job_id: int, payload: ApplicationCreate):
        job = db.get(Job, job_id)
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        
        existing = db.query(Application).filter(
            Application.user_id == user.id, Application.job_id == job_id
        ).first()
        
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application already exists")
            
        application = Application(
            user_id=user.id, job_id=job_id,
            resume_text=payload.resume_text, status="applied",
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        return self._enrich(db, application)
        
    def get_user_applications(self, db: Session, user: User):
        apps = db.query(Application).filter(Application.user_id == user.id).all()
        return [self._enrich(db, a) for a in apps]

    def get_application_for_user(self, db: Session, application_id: int, user: User):
        app = db.query(Application).filter(
            Application.id == application_id, Application.user_id == user.id
        ).first()
        if app:
            return self._enrich(db, app)
        return None

    def get_applications_for_recruiter_job(self, db: Session, job_id: int, recruiter_id: int):
        job = db.get(Job, job_id)
        if not job or job.user_id != recruiter_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your job")
        
        apps = db.query(Application).filter(Application.job_id == job_id).all()
        return [self._enrich_with_email(db, a) for a in apps]

    def update_application_status(self, db: Session, application: Application, payload: ApplicationStatusUpdate):
        if payload.status not in ALLOWED_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
            
        application.status = payload.status
        db.commit()
        db.refresh(application)
        return self._enrich(db, application)

    def _enrich(self, db: Session, application: Application):
        # We manually fetch the job so Pydantic doesn't crash if the relationship is lazy-loaded
        job = db.query(Job).filter(Job.id == application.job_id).first()
        application.job_title = job.title if job else None
        application.job_company = job.company if job else None
        return application

    def _enrich_with_email(self, db: Session, application: Application):
        self._enrich(db, application)
        user = db.query(User).filter(User.id == application.user_id).first()
        application.applicant_email = user.email if user else None
        return application
