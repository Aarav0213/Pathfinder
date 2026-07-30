import requests
import json
from html import unescape
import re

def strip_html(text):
    return re.sub(r'<[^>]+>', ' ', unescape(text or "")).strip()

print("=== GREENHOUSE - multiple companies ===")
for company in ["stripe", "airbnb", "coinbase", "dropbox", "palantir"]:
    res = requests.get("https://boards-api.greenhouse.io/v1/boards/" + company + "/jobs?content=true")
    if res.status_code == 200:
        jobs = res.json().get("jobs", [])
        intern = [j for j in jobs if "intern" in j.get("title","").lower()]
        print(company + ": " + str(len(jobs)) + " total, " + str(len(intern)) + " internships")
    else:
        print(company + ": " + str(res.status_code))

print()
print("=== LEVER - multiple companies ===")
for company in ["netflix", "reddit", "notion", "linear", "vercel"]:
    res = requests.get("https://api.lever.co/v0/postings/" + company + "?mode=json")
    print(company + ": " + str(res.status_code) + " - " + str(len(res.json()) if res.status_code == 200 else res.text[:50]))

print()
print("=== YC JOBS ===")
res = requests.get(
    "https://www.workatastartup.com/jobs?hasEquity=false&hasSalary=false&industry=&interviewProcess=&jobType=&limit=10&offset=0&role=eng&sortBy=created_at",
    headers={"User-Agent": "Mozilla/5.0"}
)
print("Status: " + str(res.status_code))
print(res.text[:500])
