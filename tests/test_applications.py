from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.job import Job
from app.models.user import User


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


def clear_tables():
    app.dependency_overrides[get_db] = override_get_db
    db = TestingSessionLocal()
    try:
        db.close()
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    finally:
        db.close()


def register_user(email: str = "user@example.com"):
    return client.post(
        "/auth/register",
        json={"email": email, "password": "password123"},
    )


def login_user(email: str = "user@example.com"):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"},
    )
    return response.json()["access_token"]


def create_job():
    db = TestingSessionLocal()
    try:
        job = Job(
            title="Backend Engineer",
            company="Acme",
            location="Remote",
            description="Build and maintain APIs for a production system.",
            posted_at=datetime.now(timezone.utc),
            created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
            updated_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    finally:
        db.close()


def test_apply_to_job():
    clear_tables()
    register_user()
    token = login_user()
    job = create_job()

    response = client.post(
        f"/jobs/{job.id}/apply",
        json={"resume_text": "A" * 60},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["job_id"] == job.id
    assert response.json()["status"] == "applied"


def test_duplicate_application_blocked():
    clear_tables()
    register_user()
    token = login_user()
    job = create_job()

    payload = {"resume_text": "A" * 60}
    first = client.post(f"/jobs/{job.id}/apply", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert first.status_code == 200

    second = client.post(f"/jobs/{job.id}/apply", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert second.status_code == 400


def test_list_my_applications():
    clear_tables()
    register_user()
    token = login_user()
    job = create_job()

    client.post(
        f"/jobs/{job.id}/apply",
        json={"resume_text": "A" * 60},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.get("/applications/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["job_id"] == job.id


def test_get_application():
    clear_tables()
    register_user()
    token = login_user()
    job = create_job()
    apply_response = client.post(
        f"/jobs/{job.id}/apply",
        json={"resume_text": "A" * 60},
        headers={"Authorization": f"Bearer {token}"},
    )
    application_id = apply_response.json()["id"]

    response = client.get(f"/applications/{application_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["id"] == application_id


def test_update_status():
    clear_tables()
    register_user()
    token = login_user()
    job = create_job()
    apply_response = client.post(
        f"/jobs/{job.id}/apply",
        json={"resume_text": "A" * 60},
        headers={"Authorization": f"Bearer {token}"},
    )
    application_id = apply_response.json()["id"]

    response = client.patch(
        f"/applications/{application_id}/status",
        json={"status": "reviewing"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "reviewing"


def test_unauthorized_access():
    clear_tables()
    response = client.get("/applications/me")
    assert response.status_code == 401


def test_invalid_job():
    clear_tables()
    register_user()
    token = login_user()

    response = client.post(
        "/jobs/999/apply",
        json={"resume_text": "A" * 60},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_invalid_application():
    clear_tables()
    register_user()
    token = login_user()

    response = client.get("/applications/999", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404
