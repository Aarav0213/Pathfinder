from datetime import datetime

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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class ApplicationCreate(BaseModel):
    resume_text: str = Field(min_length=50)


class ApplicationStatusUpdate(BaseModel):
    status: str


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    job_id: int
    resume_text: str
    status: str
    created_at: datetime
