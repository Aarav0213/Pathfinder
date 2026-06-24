from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.job import Job
from app.models.user import User
from app.schemas import JobCreate, JobUpdate


class JobService:
    def get_jobs(
        self,
        db: Session,
        limit: int = 50,
        offset: int = 0,
        keyword: str | None = None,
        company: str | None = None,
        location: str | None = None,
        sort: str = "newest",
    ):
        query = db.query(Job)

        if keyword:
            search = f"%{keyword}%"
            query = query.filter(
                Job.title.ilike(search)
                | Job.company.ilike(search)
                | Job.description.ilike(search)
            )

        if company:
            query = query.filter(Job.company == company)

        if location:
            query = query.filter(Job.location == location)

        if sort == "oldest":
            query = query.order_by(Job.created_at.asc(), Job.id.asc())
        else:
            query = query.order_by(Job.created_at.desc(), Job.id.desc())

        return query.offset(offset).limit(limit).all()

    def get_job(self, db: Session, job_id: int):
        return db.get(Job, job_id)

    def check_job_post_limit(self, db: Session, user: User) -> None:
        if user.role in {"recruiter", "admin"}:
            return
        active_jobs = db.query(Job).filter(Job.user_id == user.id).count()
        if active_jobs >= 3:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Free plan job limit reached")

    def create_job(self, db: Session, job_data: JobCreate, user: User | None = None):
        if user is not None:
            self.check_job_post_limit(db, user)
        job = Job(
            user_id=user.id if user else None,
            title=job_data.title,
            company=job_data.company,
            location=job_data.location,
            description=job_data.description,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    def update_job(self, db: Session, job: Job, job_data: JobUpdate):
        job.title = job_data.title
        job.company = job_data.company
        job.location = job_data.location
        job.description = job_data.description
        db.commit()
        db.refresh(job)
        return job

    def delete_job(self, db: Session, job: Job):
        db.delete(job)
        db.commit()
        return job
