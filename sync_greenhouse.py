import sys
sys.path.append(".")
import hashlib
import re
import requests
from html import unescape
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.job import Job

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
    "canva", "miro", "figma", "intercom", "zendesk",
    "hubspot", "monday", "clickup", "notion", "linear",
    "vercel", "supabase", "planetscale", "neon", "railway",
    "discord", "twitch", "roblox", "unity", "epic-games",
    "peloton", "calm", "headspace", "noom", "hims",
    "oscar-health", "ro", "devoted-health", "cityblock",
    "ripple", "coinbase", "gemini", "kraken", "chainalysis",
    "plaid", "marqeta", "checkout", "stripe", "adyen",
    "sequoia", "andreessen-horowitz", "y-combinator",
    "nvidia", "arm", "qualcomm", "marvell", "lattice-semi",
    "spacex", "boeing", "lockheed-martin", "northrop-grumman",
    "johnson-controls", "honeywell", "ge", "siemens",
    "mckinsey", "bain", "bcg", "deloitte", "pwc",
    "jpmorgan", "goldman-sachs", "morgan-stanley", "blackrock",
    "capital-one", "american-express", "visa", "mastercard",
]

def strip_html(text):
    text = unescape(text or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def make_hash(title, company, location):
    key = (title + "|" + company + "|" + location).lower().strip()
    return hashlib.md5(key.encode()).hexdigest()

def sync_greenhouse():
    db = SessionLocal()
    added = 0
    found_companies = 0

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

            if intern_jobs:
                found_companies += 1

            for j in intern_jobs:
                title = (j.get("title") or "")[:200]
                company = (j.get("company_name") or slug.replace("-", " ").title())[:200]
                location = (j.get("location", {}).get("name") or "Remote")[:200]
                description = strip_html(j.get("content") or "")
                apply_url = j.get("absolute_url") or ""

                if not title or not description:
                    continue

                h = make_hash(title, company, location)
                existing = db.query(Job).filter(Job.dedup_hash == h).first()
                if not existing:
                    db.add(Job(
                        title=title,
                        company=company,
                        location=location,
                        description=description,
                        apply_url=apply_url,
                        source="greenhouse",
                        dedup_hash=h,
                        employment_type="INTERN",
                        user_id=None,
                        posted_at=datetime.now(timezone.utc),
                    ))
                    added += 1

            if intern_jobs:
                print(slug + ": " + str(len(intern_jobs)) + " internships")

        except Exception as e:
            pass

    db.commit()
    db.close()
    print("Greenhouse sync complete. Companies with internships: " + str(found_companies) + " Added: " + str(added))
    return added

if __name__ == "__main__":
    sync_greenhouse()
