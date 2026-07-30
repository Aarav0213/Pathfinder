import sys
sys.path.append(".")
import hashlib
import re
import time
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.job import Job

def make_hash(title, company, location):
    key = (title + "|" + company + "|" + location).lower().strip()
    return hashlib.md5(key.encode()).hexdigest()

def strip_html(text):
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()

CAREER_PAGES = [
    {"company": "Microsoft", "url": "https://jobs.careers.microsoft.com/global/en/search?q=intern&lc=United%20States&l=en_us&pg=1&pgSz=20&o=Relevance&flt=true"},
    {"company": "Apple", "url": "https://jobs.apple.com/en-us/search?search=intern&sort=newest"},
    {"company": "Netflix", "url": "https://jobs.netflix.com/search?q=intern"},
    {"company": "Uber", "url": "https://www.uber.com/us/en/careers/list/?query=intern"},
    {"company": "Spotify", "url": "https://jobs.lever.co/spotify?commitment=Internship"},
    {"company": "Twitter", "url": "https://careers.twitter.com/en/jobs.html#?q=intern"},
    {"company": "Salesforce", "url": "https://careers.salesforce.com/en/jobs/?search=intern&pagesize=20"},
]

def scrape_with_playwright(db) -> int:
    from playwright.sync_api import sync_playwright
    added = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})

        for target in CAREER_PAGES:
            company = target["company"]
            url = target["url"]
            try:
                print("Scraping " + company + "...")
                page.goto(url, timeout=15000, wait_until="domcontentloaded")
                page.wait_for_timeout(2000)
                html = page.content()

                patterns = [
                    r'<[^>]*class="[^"]*job[^"]*title[^"]*"[^>]*>([^<]+)<',
                    r'<[^>]*class="[^"]*position[^"]*"[^>]*>([^<]+)<',
                    r'<h\d[^>]*>([^<]*intern[^<]*)</h\d>',
                    r'<a[^>]*href="[^"]*job[^"]*"[^>]*>([^<]*intern[^<]*)</a>',
                ]

                found_titles = set()
                for pattern in patterns:
                    matches = re.findall(pattern, html, re.IGNORECASE)
                    for m in matches:
                        cleaned = m.strip()
                        if len(cleaned) > 5 and len(cleaned) < 200 and "intern" in cleaned.lower():
                            found_titles.add(cleaned)

                print(company + ": found " + str(len(found_titles)) + " potential titles")

                for title in list(found_titles)[:20]:
                    h = make_hash(title, company, "United States")
                    if not db.query(Job).filter(Job.dedup_hash == h).first():
                        db.add(Job(
                            title=title,
                            company=company,
                            location="United States",
                            description="Internship opportunity at " + company + ". Visit " + url + " for full details and to apply.",
                            apply_url=url,
                            source="career_page",
                            dedup_hash=h,
                            employment_type="INTERN",
                            user_id=None,
                            posted_at=datetime.now(timezone.utc),
                        ))
                        added += 1

                db.commit()
                time.sleep(1)

            except Exception as e:
                print(company + " error: " + str(e))

        browser.close()

    return added

if __name__ == "__main__":
    db = SessionLocal()
    try:
        added = scrape_with_playwright(db)
        print("Career page scrape complete. Added: " + str(added))
    finally:
        db.close()
