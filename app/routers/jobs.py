from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import ApplicationCreate, ApplicationResponse, JobCreate, JobResponse, JobUpdate
from app.services.job_service import JobService
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/jobs", tags=["jobs"])
job_service = JobService()
application_service = ApplicationService()

@router.get("/mine", response_model=list[JobResponse])
def get_my_jobs(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return job_service.get_jobs_by_user(db, current_user.id, limit=limit, offset=offset)

@router.get("", response_model=list[JobResponse])
def get_jobs(
    limit: int = 50,
    offset: int = 0,
    keyword: str | None = None,
    company: str | None = None,
    location: str | None = None,
    sort: str = "newest",
    date_range: str | None = None,
    remote_only: bool = False,
    employment_type: str | None = None,
    db: Session = Depends(get_db),
):
    return job_service.get_jobs(
        db,
        limit=limit,
        offset=offset,
        keyword=keyword,
        company=company,
        location=location,
        sort=sort,
        date_range=date_range,
        remote_only=remote_only,
        employment_type=employment_type,
    )

@router.post("", response_model=JobResponse)
def create_job(job_data: JobCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return job_service.create_job(db, job_data, current_user)

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = job_service.get_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job

@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, job_data: JobUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    job = job_service.get_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job_service.update_job(db, job, job_data)

@router.delete("/{job_id}", response_model=JobResponse)
def delete_job(job_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    job = job_service.get_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job_service.delete_job(db, job)

@router.post("/{job_id}/apply", response_model=ApplicationResponse)
def apply_to_job(
    job_id: int,
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return application_service.create_application(db, current_user, job_id, payload)


