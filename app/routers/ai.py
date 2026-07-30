import os
import requests
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import AIGenerateRequest, AIGenerateResponse
from app.models.job import Job

router = APIRouter(prefix="/ai", tags=["ai"])

OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")

MODELS = [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "openai/gpt-oss-20b:free",
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
]

def call_ai(prompt: str) -> str:
    last_error = "AI service unavailable"
    for model in MODELS:
        try:
            res = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": "Bearer " + OPENROUTER_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 2000,
                },
                timeout=60,
            )
            data = res.json()
            if res.status_code != 200:
                print("Model " + model + " failed: " + str(data.get("error", {})))
                last_error = str(data.get("error", {}).get("message", "error"))
                continue
            choices = data.get("choices", [])
            if not choices:
                print("Model " + model + " returned no choices")
                continue
            content = choices[0].get("message", {}).get("content") or ""
            if not content:
                print("Model " + model + " returned empty content")
                continue
            print("Model " + model + " succeeded")
            return content.strip()
        except Exception as e:
            print("Model " + model + " exception: " + str(e))
            last_error = str(e)
            continue
    raise HTTPException(status_code=500, detail="AI service unavailable: " + last_error)

@router.post("/generate", response_model=AIGenerateResponse)
def generate(
    payload: AIGenerateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_premium:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Premium required")

    job = db.get(Job, payload.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    resume = current_user.resume_text or ""

    if payload.type == "cover_letter":
        prompt = (
            "You are a professional career coach writing a cover letter strictly based on what the candidate has provided.\n\n"
            "STRICT RULES - violating any rule makes the output unusable:\n"
            "- Plain text only. Zero markdown. Zero bold. Zero bullet points. Zero headers. Zero symbols.\n"
            "- Write exactly 3 paragraphs separated by blank lines.\n"
            "- Paragraph 1: Open with genuine enthusiasm for the specific role and company.\n"
            "- Paragraph 2: Reference only skills and experiences that appear word-for-word or clearly implied in the resume below. If a skill is not in the resume do not mention it.\n"
            "- Paragraph 3: Close professionally and express interest in an interview.\n"
            "- Do NOT invent, assume, or embellish any experience, skill, tool, or achievement not explicitly stated in the resume.\n"
            "- Do NOT mention any job requirement the candidate clearly does not meet.\n"
            "- Do NOT add any commentary, notes, or text after the closing paragraph.\n"
            "- Do NOT use placeholder text like [Your Name] or [Date].\n\n"
            "Job Title: " + job.title + "\n"
            "Company: " + job.company + "\n"
            "Job Description:\n" + job.description[:2000] + "\n\n"
            "Candidate Resume (use ONLY what is written here, nothing else):\n" + resume[:2000]
        )
    elif payload.type == "tailor_resume":
        prompt = (
            "You are a resume editor. Your only job is to reword the existing resume to better match the job description.\n\n"
            "STRICT RULES - violating any rule makes the output unusable:\n"
            "- Plain text only. Zero markdown. Zero bold. Zero asterisks. Zero dashes as headers. Zero symbols.\n"
            "- You may ONLY use information that already exists in the original resume below.\n"
            "- Do NOT add any new skills, tools, technologies, companies, job titles, or achievements.\n"
            "- Do NOT invent dates, metrics, or responsibilities that are not in the original resume.\n"
            "- Do NOT add AWS, DynamoDB, PySpark, or any other technology unless it is explicitly in the original resume.\n"
            "- Reword existing bullet points to use similar language and keywords from the job description where truthful.\n"
            "- Keep the exact same sections in the same order as the original resume.\n"
            "- Do NOT add commentary, notes, disclaimers, or any text that was not part of the original resume.\n\n"
            "Job Title: " + job.title + "\n"
            "Company: " + job.company + "\n"
            "Job Description:\n" + job.description[:2000] + "\n\n"
            "Original Resume (reword only what is here, add nothing new):\n" + resume[:2000]
        )
    else:
        raise HTTPException(status_code=400, detail="type must be cover_letter or tailor_resume")

    result = call_ai(prompt)
    return AIGenerateResponse(result=result)
