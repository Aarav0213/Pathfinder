import os
import sys
sys.path.append(".")
import hashlib
import requests
from app.database import SessionLocal
from app.models.job import Job
from datetime import datetime, timezone

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

def make_hash(title, company, location):
    key = (title + "|" + company + "|" + location).lower().strip()
    return hashlib.md5(key.encode()).hexdigest()

db = SessionLocal()

queries = [
    "software engineer internship",
    "data science internship",
    "machine learning internship",
    "frontend intern",
    "backend intern",
    "product manager internship",
    "data engineering internship",
    "cybersecurity internship",
    "ios engineer internship",
    "android engineer internship",
    "devops internship",
    "cloud engineering internship",
    "quant internship",
    "finance internship technology",
    "research scientist internship",
]

added = 0

for query in queries:
    print("Fetching: " + query)
    res = requests.get(
        "https://jsearch.p.rapidapi.com/search-v2",
        headers={
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
            "x-rapidapi-key": RAPIDAPI_KEY,
            "Content-Type": "application/json",
        },
        params={"query": query, "num_pages": "1", "country": "us", "date_posted": "month"},
    )
    if res.status_code != 200:
        print("Failed: " + str(res.status_code))
        continue

    jobs = res.json().get("data", {}).get("jobs", [])
    print("Got " + str(len(jobs)) + " results")

    for j in jobs:
        title = (j.get("job_title") or "")[:200]
        company = (j.get("employer_name") or "")[:200]
        location = (j.get("job_city") or j.get("job_country") or "Remote")[:200]
        description = j.get("job_description") or ""
        apply_url = j.get("job_apply_link") or ""
        employment_type = (j.get("job_employment_type") or "").upper()

        if not title or not company or not description:
            continue

        h = make_hash(title, company, location)
        if not db.query(Job).filter(Job.dedup_hash == h).first():
            db.add(Job(
                title=title,
                company=company,
                location=location,
                description=description,
                apply_url=apply_url,
                source="jsearch",
                dedup_hash=h,
                employment_type=employment_type,
                user_id=None,
                posted_at=datetime.now(timezone.utc),
            ))
            added += 1

db.commit()
db.close()
print("Done. Added " + str(added) + " jobs.")
