import os
import hashlib
import re
import time
import threading
import requests
from html import unescape
from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.job import Job
from app.models.search_gap import SearchGap
from app.models.watchlist import Watchlist
from app.models.notification import Notification
from app.models.user import User

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")

GREENHOUSE_COMPANIES = [
    "stripe", "airbnb", "coinbase", "dropbox", "lyft", "doordash",
    "robinhood", "brex", "figma", "notion", "airtable", "asana",
    "gusto", "plaid", "rippling", "lattice", "benchling",
    "scale-ai", "openai", "anthropic", "cohere", "databricks",
    "snowflake", "datadog", "hashicorp", "cloudflare", "netlify",
    "twilio", "segment", "mixpanel", "amplitude", "heap",
    "ramp", "mercury", "moderntreasury", "nerdwallet", "sofi",
    "marqeta", "adyen", "affirm", "klarna", "duolingo", "coursera",
    "waymo", "cruise", "aurora", "nvidia", "amd", "qualcomm",
    "relativity-space", "rocket-lab", "planet",
    "palantir", "flexport", "faire", "procore", "toast",
    "canva", "miro", "intercom", "zendesk", "hubspot",
    "monday", "clickup", "linear", "vercel", "supabase",
    "discord", "roblox", "unity", "peloton",
    "ripple", "gemini", "spacex",
]

def strip_html(text):
    text = unescape(text or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def make_hash(title, company, location):
    key = (title + "|" + company + "|" + location).lower().strip()
    return hashlib.md5(key.encode()).hexdigest()

def summarize_to_tags(description: str) -> str:
    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": "Bearer " + OPENROUTER_KEY,
                "Content-Type": "application/json",
            },
            json={
                "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
                "messages": [{"role": "user", "content": (
                    "Extract 5 to 8 concise bullet point tags from this job description. "
                    "Focus on skills, technologies, role type, and experience level. "
                    "Return only the bullet points, nothing else.\n\n" + description[:1500]
                )}],
                "max_tokens": 200,
            },
            timeout=30,
        )
        return res.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print("AI tagging failed: " + str(e))
        return ""

def create_notification(db, user_id: int, title: str, message: str):
    db.add(Notification(user_id=user_id, title=title, message=message))

def send_watchlist_email(email: str, company: str, jobs: list):
    try:
        from app.services.email_service import send_watchlist_alert
        send_watchlist_alert(email, company, jobs)
    except Exception as e:
        print("Watchlist email error: " + str(e))

def fetch_jsearch(query: str, db) -> int:
    try:
        res = requests.get(
            "https://jsearch.p.rapidapi.com/search-v2",
            headers={
                "x-rapidapi-host": "jsearch.p.rapidapi.com",
                "x-rapidapi-key": RAPIDAPI_KEY,
                "Content-Type": "application/json",
            },
            params={"query": query + " internship", "num_pages": "1", "country": "us", "date_posted": "month"},
            timeout=20,
        )
        if res.status_code != 200:
            return 0
        jobs = res.json().get("data", {}).get("jobs", [])
        added = 0
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
                tags = summarize_to_tags(description)
                db.add(Job(
                    title=title, company=company, location=location,
                    description=description, apply_url=apply_url,
                    source="jsearch", ai_tags=tags, dedup_hash=h,
                    employment_type=employment_type,
                    user_id=None, posted_at=datetime.now(timezone.utc),
                ))
                added += 1
                time.sleep(0.5)
        db.commit()
        return added
    except Exception as e:
        print("JSearch error: " + str(e))
        return 0

def fetch_jsearch_for_watchlist(company: str, db) -> int:
    try:
        res = requests.get(
            "https://jsearch.p.rapidapi.com/search-v2",
            headers={
                "x-rapidapi-host": "jsearch.p.rapidapi.com",
                "x-rapidapi-key": RAPIDAPI_KEY,
                "Content-Type": "application/json",
            },
            params={"query": company + " internship", "num_pages": "1", "country": "us", "date_posted": "month"},
            timeout=20,
        )
        if res.status_code != 200:
            return 0
        jobs = res.json().get("data", {}).get("jobs", [])
        added = 0
        new_jobs = []
        for j in jobs:
            title = (j.get("job_title") or "")[:200]
            comp = (j.get("employer_name") or "")[:200]
            location = (j.get("job_city") or j.get("job_country") or "Remote")[:200]
            description = j.get("job_description") or ""
            apply_url = j.get("job_apply_link") or ""
            employment_type = (j.get("job_employment_type") or "").upper()
            if not title or not comp or not description:
                continue
            h = make_hash(title, comp, location)
            if not db.query(Job).filter(Job.dedup_hash == h).first():
                tags = summarize_to_tags(description)
                db.add(Job(
                    title=title, company=comp, location=location,
                    description=description, apply_url=apply_url,
                    source="jsearch", ai_tags=tags, dedup_hash=h,
                    employment_type=employment_type,
                    user_id=None, posted_at=datetime.now(timezone.utc),
                ))
                new_jobs.append(title)
                added += 1
                time.sleep(0.5)
        db.commit()
        if new_jobs:
            watchers = db.query(Watchlist).filter(Watchlist.company.ilike("%" + company + "%")).all()
            for watcher in watchers:
                create_notification(
                    db, watcher.user_id,
                    company + " posted new internships",
                    str(len(new_jobs)) + " new role(s): " + ", ".join(new_jobs[:3]) + ("..." if len(new_jobs) > 3 else ""),
                )
                user = db.get(User, watcher.user_id)
                if user:
                    send_watchlist_email(user.email, company, new_jobs)
            db.commit()
        return added
    except Exception as e:
        print("JSearch watchlist error: " + str(e))
        return 0

def fetch_greenhouse(db) -> int:
    added = 0
    for slug in GREENHOUSE_COMPANIES:
        try:
            res = requests.get(
                "https://boards-api.greenhouse.io/v1/boards/" + slug + "/jobs?content=true",
                timeout=10,
            )
            if res.status_code != 200:
                continue
            jobs = res.json().get("jobs", [])
            intern_jobs = [j for j in jobs if "intern" in j.get("title", "").lower()]
            for j in intern_jobs:
                title = (j.get("title") or "")[:200]
                company = (j.get("company_name") or slug.replace("-", " ").title())[:200]
                location = (j.get("location", {}).get("name") or "Remote")[:200]
                description = strip_html(j.get("content") or "")
                apply_url = j.get("absolute_url") or ""
                if not title or not description:
                    continue
                h = make_hash(title, company, location)
                if not db.query(Job).filter(Job.dedup_hash == h).first():
                    db.add(Job(
                        title=title, company=company, location=location,
                        description=description, apply_url=apply_url,
                        source="greenhouse", dedup_hash=h,
                        employment_type="INTERN",
                        user_id=None, posted_at=datetime.now(timezone.utc),
                    ))
                    added += 1
            time.sleep(0.3)
        except Exception as e:
            print("Greenhouse error for " + slug + ": " + str(e))
    db.commit()
    print("[Scheduler] Greenhouse added: " + str(added))
    return added

def run_overnight_pipeline():
    print("[Scheduler] Starting overnight pipeline...")
    db = SessionLocal()
    try:
        gaps = db.query(SearchGap).filter(SearchGap.filled == 0).all()
        print("[Scheduler] Search gaps: " + str(len(gaps)))
        for gap in gaps:
            added = fetch_jsearch(gap.query, db)
            print("[Scheduler] Gap added " + str(added))
            gap.filled = 1
            db.commit()
            time.sleep(2)

        watchlist_companies = [row[0] for row in db.query(Watchlist.company).distinct().all()]
        print("[Scheduler] Watchlist companies: " + str(len(watchlist_companies)))
        for company in watchlist_companies:
            added = fetch_jsearch_for_watchlist(company, db)
            print("[Scheduler] Watchlist added " + str(added) + " for " + company)
            time.sleep(2)

        fetch_greenhouse(db)

    except Exception as e:
        print("[Scheduler] Pipeline error: " + str(e))
    finally:
        db.close()
    print("[Scheduler] Overnight pipeline complete.")

def seconds_until_2am():
    now = datetime.now()
    target = now.replace(hour=2, minute=0, second=0, microsecond=0)
    if now >= target:
        target = target + timedelta(days=1)
    return (target - now).total_seconds()

def scheduler_loop():
    while True:
        try:
            wait = seconds_until_2am()
            print("[Scheduler] Next run in " + str(int(wait // 3600)) + "h " + str(int((wait % 3600) // 60)) + "m")
            time.sleep(wait)
            run_overnight_pipeline()
        except Exception as e:
            print("[Scheduler] Unexpected error: " + str(e))
            time.sleep(60)

def start_scheduler():
    thread = threading.Thread(target=scheduler_loop, daemon=True)
    thread.start()
    print("[Scheduler] Background scheduler started.")
