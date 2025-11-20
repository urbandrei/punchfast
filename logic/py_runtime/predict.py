
import argparse, json, re, requests, joblib, numpy as np
from bs4 import BeautifulSoup
from scipy import sparse
from sklearn.preprocessing import normalize
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os

TOKEN_RE = re.compile(r"[a-z0-9]+", re.I)
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

def tokenize(html: str):
    try:
        soup = BeautifulSoup(html, "lxml")
        text = soup.get_text(" ")
    except Exception:
        text = html
    return [t.lower() for t in TOKEN_RE.findall(text)]

def fetch_url(url: str, timeout: int = 25) -> str:
    """Fetch with retries/backoff for robustness on heavy sites."""
    sess = requests.Session()
    retries = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=0.8,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"]
    )
    sess.headers.update({"User-Agent": UA})
    sess.mount("http://", HTTPAdapter(max_retries=retries))
    sess.mount("https://", HTTPAdapter(max_retries=retries))
    resp = sess.get(url, timeout=timeout, allow_redirects=True)
    resp.raise_for_status()
    return resp.text

def vectorize(tokens, token2id):
    # count
    col_counts = {}
    for t in tokens:
        if t in token2id:
            col = token2id[t]
            col_counts[col] = col_counts.get(col, 0) + 1
    if not col_counts:
        return None
    import numpy as np
    cols = np.array(list(col_counts.keys()))
    vals = np.array(list(col_counts.values()), dtype=np.float32)
    X = sparse.csr_matrix((vals, (np.zeros_like(cols), cols)), shape=(1, len(token2id)))
    X = normalize(X, norm="l2", copy=False)
    return X

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", help="Website to classify")
    ap.add_argument("--html", help="Local HTML file to classify (offline/cached)")
    ap.add_argument("--vocab", required=True)
    ap.add_argument("--labels", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--timeout", type=int, default=25)
    args = ap.parse_args()

    if not args.url and not args.html:
        raise SystemExit("Provide --url or --html")

    token2id = json.load(open(args.vocab, "r", encoding="utf-8"))["token2id"]
    le = joblib.load(args.labels)
    clf = joblib.load(args.model)

    if args.html:
        if not os.path.exists(args.html):
            raise SystemExit(f"HTML file not found: {args.html}")
        html = open(args.html, "r", encoding="utf-8", errors="ignore").read()
    else:
        html = fetch_url(args.url, timeout=args.timeout)

    toks = tokenize(html)
    X = vectorize(toks, token2id)
    if X is None:
        print(json.dumps({"cuisine": None, "proba": 0.0}))
        return

    # predict
    import numpy as np
    if hasattr(clf, "predict_proba"):
        proba = clf.predict_proba(X)[0]
        idx = int(np.argmax(proba))
        score = float(proba[idx])
    else:
        idx = int(clf.predict(X)[0])
        score = 1.0

    pred = le.inverse_transform([idx])[0]
    print(json.dumps({"cuisine": pred, "proba": score}))

if __name__ == "__main__":
    main()