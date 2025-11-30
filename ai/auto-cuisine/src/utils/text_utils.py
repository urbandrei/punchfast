import re
import tldextract

def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()

def tokenize_domain(url: str):
    try:
        ext = tldextract.extract(url or "")
        host = ".".join([p for p in [ext.subdomain, ext.domain, ext.suffix] if p])
        tokens = re.split(r"[^a-z0-9]+", host.lower())
        return [t for t in tokens if t]
    except Exception:
        return []

def keyword_hits(text: str, keywords: dict):
    text = (text or "").lower()
    hits = set()
    for k, tags in keywords.items():
        if k in text:
            hits.update(tags)
    return list(hits)
