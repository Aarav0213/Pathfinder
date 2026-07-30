import sys
sys.path.append(".")
from playwright.sync_api import sync_playwright
import re

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
    page.goto("https://jobs.lever.co/spotify?commitment=Internship", timeout=20000, wait_until="networkidle")
    page.wait_for_timeout(3000)

    postings = page.query_selector_all(".posting-title h5")
    print("posting-title h5:", len(postings))
    for p2 in postings[:5]:
        print(" -", p2.inner_text())

    postings2 = page.query_selector_all("[data-qa='posting-name']")
    print("data-qa posting-name:", len(postings2))
    for p2 in postings2[:5]:
        print(" -", p2.inner_text())

    links = page.query_selector_all("a.posting-title")
    print("a.posting-title:", len(links))
    for l in links[:5]:
        print(" -", l.inner_text(), "|", l.get_attribute("href"))

    browser.close()
