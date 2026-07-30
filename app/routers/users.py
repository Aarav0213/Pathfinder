import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import UserProfileUpdate, UserResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])

def extract_pdf_text(data: bytes) -> str:
    try:
        from pdfminer.high_level import extract_text_to_fp
        from pdfminer.layout import LAParams
        output = io.StringIO()
        extract_text_to_fp(io.BytesIO(data), output, laparams=LAParams())
        return output.getvalue().strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not parse PDF: " + str(e))

def extract_docx_text(data: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(data))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not parse DOCX: " + str(e))

@router.get("/me", response_model=UserResponse)
def get_profile(current_user=Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/resume/upload", response_model=UserResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.lower().split(".")[-1]
    if ext not in ("pdf", "docx", "txt"):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")

    data = await file.read()

    if ext == "pdf":
        text = extract_pdf_text(data)
    elif ext == "docx":
        text = extract_docx_text(data)
    else:
        text = data.decode("utf-8", errors="ignore")

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract enough text from the file")

    current_user.resume_text = text.strip()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/upgrade", response_model=UserResponse)
def upgrade_to_premium(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    current_user.is_premium = 1
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/downgrade", response_model=UserResponse)
def downgrade_from_premium(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    current_user.is_premium = 0
    db.commit()
    db.refresh(current_user)
    return current_user
