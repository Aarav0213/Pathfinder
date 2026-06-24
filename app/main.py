from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.routers.auth import router as auth_router
from app.routers.jobs import router as jobs_router
from app.routers.applications import router as applications_router

app = FastAPI(title="Job Board API", version="1.0.0")

# IMPORTANT: CORS MUST BE FIRST THING AFTER APP CREATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure DB tables exist
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# Routes
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(applications_router)


@app.get("/")
def root():
    return {"message": "Job Board API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
