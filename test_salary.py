import os
import requests
import json

res = requests.get(
    "https://jsearch.p.rapidapi.com/search-v2",
    headers={
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": os.getenv("RAPIDAPI_KEY"),
        "Content-Type": "application/json",
    },
    params={"query": "software engineer internship", "num_pages": "1", "country": "us"},
)
jobs = res.json().get("data", {}).get("jobs", [])
if jobs:
    j = jobs[0]
    salary_keys = {k: v for k, v in j.items() if "salary" in k.lower() or "pay" in k.lower() or "compensation" in k.lower()}
    print(json.dumps(salary_keys, indent=2))
