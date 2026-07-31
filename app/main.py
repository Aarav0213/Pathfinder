from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from app.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.jobs import router as jobs_router
from app.routers.applications import router as applications_router
from app.routers.users import router as users_router
from app.routers.saved import router as saved_router
from app.routers.watchlist import router as watchlist_router
from app.routers.ai import router as ai_router
from app.routers.notifications import router as notifications_router
from app.routers.recommendations import router as recommendations_router
from app.routers.admin import router as admin_router
from app.routers.payments import router as payments_router
from app.services.scheduler import start_scheduler



app = FastAPI(title="Pathfinder API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    start_scheduler()

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(users_router)
app.include_router(saved_router)
app.include_router(watchlist_router)
app.include_router(ai_router)
app.include_router(notifications_router)
app.include_router(recommendations_router)
app.include_router(admin_router)
app.include_router(payments_router)

@app.get("/")
def root():
    return {"message": "Pathfinder API"}

@app.get("/health")
def health():
    return {"status": "healthy"}






import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    print("="*60)
    print(f"UNHANDLED ERROR on {request.method} {request.url.path}")
    traceback.print_exc()
    print("="*60)
    return JSONResponse(status_code=500, content={"detail": str(exc)})