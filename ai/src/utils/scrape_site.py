import time, random, re, requests
from typing import Dict, Any
from bs4 import BeautifulSoup
from .jsonld_utils import extract_jsonld, harvest_schema_cues

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

def fetch(url: str, timeout=10) -> str:
    if not url or not isinstance(url, str):
        return ""
    try:
        resp = requests.get(url, headers={"User-Agent": UA}, timeout=timeout)
        if resp.status_code == 200 and resp.text:
            return resp.text
    except Exception:
        pass
    return ""

LIKELY_MENU_PATTERNS = [r"/menu", r"/our-?menu", r"/food", r"/order", r"/order-?online", r"/locations/.+/menu"]

def find_menu_links(html: str):
    links = set()
    try:
        soup = BeautifulSoup(html, "lxml")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if any(re.search(p, href, flags=re.I) for p in LIKELY_MENU_PATTERNS):
                links.add(href)
    except Exception:
        pass
    return list(links)[:3]

def visible_text(html: str) -> str:
    try:
        soup = BeautifulSoup(html, "lxml")
        for bad in soup(["script","style","noscript"]):
            bad.extract()
        text = soup.get_text(separator=" ")
        return re.sub(r"\s+", " ", text).strip()
    except Exception:
        return ""

def scrape_site(url: str) -> Dict[str, Any]:
    out = {"url": url, "title": "", "meta_desc": "", "text": "", "jsonld_types": [], "jsonld_menu_items": []}
    html = fetch(url)
    if not html:
        return out
    try:
        soup = BeautifulSoup(html, "lxml")
        if soup.title and soup.title.text:
            out["title"] = soup.title.text.strip()
        md = soup.find("meta", attrs={"name": "description"})
        if md and md.get("content"):
            out["meta_desc"] = md["content"].strip()
    except Exception:
        pass

    out["text"] = visible_text(html)
    cues = harvest_schema_cues(extract_jsonld(html))
    out["jsonld_types"] = cues.get("types", [])
    out["jsonld_menu_items"] = cues.get("menu_items", [])

    from urllib.parse import urljoin
    for href in find_menu_links(html):
        link = urljoin(url, href) if href.startswith("/") else href
        sub_html = fetch(link, timeout=8)
        if not sub_html:
            continue
        out["text"] += " " + visible_text(sub_html)
        cues2 = harvest_schema_cues(extract_jsonld(sub_html))
        out["jsonld_types"].extend(cues2.get("types", []))
        out["jsonld_menu_items"].extend(cues2.get("menu_items", []))

    out["jsonld_types"] = sorted(set([t.lower() for t in out["jsonld_types"]]))
    out["jsonld_menu_items"] = sorted(set([t.lower() for t in out["jsonld_menu_items"]]))
    time.sleep(random.uniform(0.5, 1.5))
    return out
