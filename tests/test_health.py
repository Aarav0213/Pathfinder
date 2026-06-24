from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.job import Job


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def clear_jobs():
    app.dependency_overrides[get_db] = override_get_db
    db = TestingSessionLocal()
    try:
        db.query(Job).delete()
        db.commit()
    finally:
        db.close()


def seed_job(
    title: str,
    company: str,
    location: str,
    description: str,
    created_at: datetime,
):
    db = TestingSessionLocal()
    try:
        job = Job(
            title=title,
            company=company,
            location=location,
            description=description,
            posted_at=created_at,
            created_at=created_at,
            updated_at=created_at,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    finally:
        db.close()


def test_root():
    clear_jobs()
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Job Board API"}


def test_health():
    clear_jobs()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_jobs_pagination():
    clear_jobs()
    seed_job(
        title="Job 1",
        company="Company A",
        location="Remote",
        description="First job",
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )
    seed_job(
        title="Job 2",
        company="Company B",
        location="Remote",
        description="Second job",
        created_at=datetime(2024, 1, 2, tzinfo=timezone.utc),
    )
    seed_job(
        title="Job 3",
        company="Company C",
        location="Remote",
        description="Third job",
        created_at=datetime(2024, 1, 3, tzinfo=timezone.utc),
    )

    response = client.get("/jobs", params={"limit": 2, "offset": 1})
    assert response.status_code == 200
    assert [job["title"] for job in response.json()] == ["Job 2", "Job 1"]


def test_jobs_keyword_search():
    clear_jobs()
    seed_job(
        title="Backend Engineer",
        company="Acme",
        location="Remote",
        description="FastAPI and SQLAlchemy",
        created_at=datetime(2024, 2, 1, tzinfo=timezone.utc),
    )
    seed_job(
        title="Frontend Engineer",
        company="Widgets",
        location="Remote",
        description="React and TypeScript",
        created_at=datetime(2024, 2, 2, tzinfo=timezone.utc),
    )

    response = client.get("/jobs", params={"keyword": "fastapi"})
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Backend Engineer"


def test_create_read_update_delete_and_404():
    clear_jobs()
    create_response = client.post(
        "/jobs",
        json={
            "title": "Backend Engineer",
            "company": "Acme",
            "location": "Remote",
            "description": "Build and maintain APIs",
        },
    )
    assert create_response.status_code == 200
    created = create_response.json()
    job_id = created["id"]

    read_response = client.get(f"/jobs/{job_id}")
    assert read_response.status_code == 200
    assert read_response.json()["title"] == "Backend Engineer"

    update_response = client.put(
        f"/jobs/{job_id}",
        json={
            "title": "Senior Backend Engineer",
            "company": "Acme",
            "location": "Remote",
            "description": "Build and maintain scalable APIs",
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Senior Backend Engineer"

    delete_response = client.delete(f"/jobs/{job_id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["id"] == job_id

    not_found_response = client.get(f"/jobs/{job_id}")
    assert not_found_response.status_code == 404
    assert not_found_response.json() == {"detail": "Job not found"}
