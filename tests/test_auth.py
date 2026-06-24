from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


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


def test_register():
    clear_tables()
    response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
    assert "id" in response.json()


def test_duplicate_register():
    clear_tables()
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert response.status_code == 400


def test_login():
    clear_tables()
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_invalid_login():
    clear_tables()
    response = client.post(
        "/auth/login",
        json={"email": "missing@example.com", "password": "password123"},
    )
    assert response.status_code == 401


def test_protected_route_success():
    clear_tables()
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    login_response = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    token = login_response.json()["access_token"]
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


def test_protected_route_unauthorized():
    clear_tables()
    response = client.get("/auth/me")
    assert response.status_code == 401
