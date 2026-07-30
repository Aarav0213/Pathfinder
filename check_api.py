import os
import requests
import json

headers = {
    "x-rapidapi-host": "jsearch.p.rapidapi.com",
    "x-rapidapi-key": os.getenv("RAPIDAPI_KEY"),
    "Content-Type": "application/json",
}

res = requests.get(
    "https://jsearch.p.rapidapi.com/search-v2",
    headers=headers,
    params={"query": "software engineer internship", "num_pages": "1", "country": "us"},
)

print(json.dumps(res.json(), indent=2)[:3000])
