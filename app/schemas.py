from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class JobCreate(BaseModel):
    title: str = Field(min_length=3)
    company: str = Field(min_length=2)
    location: str
    description: str = Field(min_length=10)

class JobUpdate(BaseModel):
    title: str = Field(min_length=3)
    company: str = Field(min_length=2)
    location: str
    description: str = Field(min_length=10)

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    company: str
    location: str
    description: str
    apply_url: Optional[str] = None
    source: Optional[str] = None
    ai_tags: Optional[str] = None
    employment_type: Optional[str] = None
    posted_at: datetime
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    role: str
    is_premium: int
    resume_text: Optional[str] = None
    skills: Optional[str] = None
    target_roles: Optional[str] = None
    preferred_locations: Optional[str] = None
    graduation_year: Optional[int] = None

class UserProfileUpdate(BaseModel):
    resume_text: Optional[str] = None
    skills: Optional[str] = None
    target_roles: Optional[str] = None
    preferred_locations: Optional[str] = None
    graduation_year: Optional[int] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class ApplicationCreate(BaseModel):
    resume_text: str = Field(min_length=50)

class ApplicationStatusUpdate(BaseModel):
    status: str
class CustomApplicationCreate(BaseModel):
    title: str = Field(min_length=2)
    company: str = Field(min_length=2)
    location: Optional[str] = "Remote"
    description: str = Field(min_length=20)
    apply_url: Optional[str] = None

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    job_id: int
    resume_text: str
    status: str
    created_at: datetime
    job_title: Optional[str] = None
    job_company: Optional[str] = None

class SavedJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    job_id: int
    created_at: datetime
    job: JobResponse

class WatchlistCreate(BaseModel):
    company: str = Field(min_length=2)

class WatchlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    company: str
    created_at: datetime

class AIGenerateRequest(BaseModel):
    job_id: int
    type: str = Field(description="cover_letter or tailor_resume")

class AIGenerateResponse(BaseModel):
    result: str

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    message: str
    read: int
    created_at: datetime

class ApplicationAnalytics(BaseModel):
    total: int
    applied: int
    reviewing: int
    interview: int
    offer: int
    rejected: int
    response_rate: float

class RecruiterApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    job_id: int
    resume_text: str
    status: str
    created_at: datetime
    job_title: Optional[str] = None
    applicant_email: Optional[str] = None


