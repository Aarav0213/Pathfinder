import requests
import json

res = requests.get(
    "https://jobs.ashbyhq.com/notion",
    headers={"User-Agent": "Mozilla/5.0"},
    timeout=10,
)
print("Status:", res.status_code)
print("Content-Type:", res.headers.get("Content-Type"))
print(res.text[:500])
