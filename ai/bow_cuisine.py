import argparse
import json
import os
import random
import time
from typing import List, Tuple

import numpy as np
import requests
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

def load_sites_from_stores(stores_path: str, max_sites: int) -> List[dict]:
    """
    Read stores.json (OSM export), extract entries that have both website and cuisine.
    Returns a list of dicts: {"url": ..., "cuisine": ...}
    """
    with open(stores_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    elements = data.get("elements", [])
    sites = []

    for el in elements:
        tags = el.get("tags", {})
        website = tags.get("website") or tags.get("url")
        cuisine = tags.get("cuisine")

        if not website or not cuisine:
            continue

        first_cuisine = cuisine.split(";")[0].strip().lower()
        if not first_cuisine:
            continue

        sites.append({"url": website, "cuisine": first_cuisine})

    random.shuffle(sites)
    if max_sites and len(sites) > max_sites:
        sites = sites[:max_sites]

    return sites


def fetch_html(url: str, timeout: int = 15) -> str:
    try:
        resp = requests.get(url, headers={"User-Agent": UA}, timeout=timeout)
        if resp.status_code == 200 and resp.text:
            return resp.text
        return ""
    except Exception:
        return ""


def html_to_text(html: str) -> str:
    """
    Convert raw HTML to plain text, drop scripts/styles, normalize whitespace.
    """
    soup = BeautifulSoup(html, "html.parser")

    
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    text = soup.get_text(separator=" ")
    text = " ".join(text.split())
    return text.lower()


def build_text_dataset(stores_path: str,
                       max_sites: int = 300,
                       timeout: int = 15) -> Tuple[List[str], List[str]]:
    """
    1) Load sites from stores.json
    2) Scrape each website
    3) Convert HTML -> text
    Returns:
      texts: list[str]  (bag-of-words inputs)
      labels: list[str] (cuisine labels)
    """
    sites = load_sites_from_stores(stores_path, max_sites=max_sites)
    texts = []
    labels = []

    print(f"Found {len(sites)} candidate sites with website + cuisine")

    for i, s in enumerate(sites, start=1):
        url = s["url"]
        cuisine = s["cuisine"]

        print(f"[{i}/{len(sites)}] Fetching {url} (label={cuisine})")
        html = fetch_html(url, timeout=timeout)
        if not html:
            print("  -> no HTML, skipping")
            continue

        text = html_to_text(html)
        if len(text) < 200:
            print("  -> page too short, skipping")
            continue

        texts.append(text)
        labels.append(cuisine)

       
        time.sleep(random.uniform(0.5, 1.5))

    print(f"\nKept {len(texts)} pages for training")
    return texts, labels



def train_model(stores_path: str,
                out_dir: str = "ai/models",
                max_sites: int = 300,
                timeout: int = 15) -> None:
    os.makedirs(out_dir, exist_ok=True)

    texts, labels = build_text_dataset(stores_path, max_sites=max_sites, timeout=timeout)

    if len(texts) < 5:
        print("Not enough pages scraped to train a model.")
        return

    le = LabelEncoder()
    y = le.fit_transform(labels)

    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2,
        lowercase=True
    )
    X = vectorizer.fit_transform(texts)

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.1, random_state=42
    )

    clf = LogisticRegression(
        max_iter=400,
        n_jobs=-1,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)

    y_train_pred = clf.predict(X_train)
    y_val_pred = clf.predict(X_val)

    print("\n=== Train accuracy ===")
    print(accuracy_score(y_train, y_train_pred))
    print("\n=== Val accuracy ===")
    print(accuracy_score(y_val, y_val_pred))

    val_classes = np.unique(y_val)
    val_class_names = [le.inverse_transform([c])[0] for c in val_classes]

    print("\n=== Val classification report (only classes seen in val) ===")
    print(
        classification_report(
            y_val,
            y_val_pred,
            labels=val_classes,
            target_names=val_class_names,
            zero_division=0,
        )
    )

    vectorizer_path = os.path.join(out_dir, "vectorizer.joblib")
    model_path = os.path.join(out_dir, "cuisine_bow_model.joblib")
    labels_path = os.path.join(out_dir, "label_encoder.joblib")

    joblib.dump(vectorizer, vectorizer_path)
    joblib.dump(clf, model_path)
    joblib.dump(le, labels_path)

    print(f"\nSaved model artifacts in {out_dir}")



def load_artifacts(model_dir: str = "ai/models"):
    vectorizer_path = os.path.join(model_dir, "vectorizer.joblib")
    model_path = os.path.join(model_dir, "cuisine_bow_model.joblib")
    labels_path = os.path.join(model_dir, "label_encoder.joblib")

    vectorizer = joblib.load(vectorizer_path)
    clf = joblib.load(model_path)
    le = joblib.load(labels_path)
    return vectorizer, clf, le


def predict_url(url: str, timeout: int = 15, model_dir: str = "ai/models") -> dict:
    """
    Fetch URL, convert to text, vectorize and predict cuisine.
    """
    html = fetch_html(url, timeout=timeout)
    if not html:
        return {"cuisine": None, "proba": 0.0, "error": "no_html"}

    text = html_to_text(html)
    if len(text) < 100:
        return {"cuisine": None, "proba": 0.0, "error": "too_short"}

    vectorizer, clf, le = load_artifacts(model_dir)
    X = vectorizer.transform([text])

    if hasattr(clf, "predict_proba"):
        proba = clf.predict_proba(X)[0]
        idx = int(np.argmax(proba))
        prob = float(proba[idx])
    else:
        idx = int(clf.predict(X)[0])
        prob = 1.0

    label = le.inverse_transform([idx])[0]
    return {"cuisine": label, "proba": round(prob, 4)}


def main():
    ap = argparse.ArgumentParser(description="BOW cuisine model (scrape + train + predict)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    # train
    ap_train = sub.add_parser("train", help="scrape websites and train cuisine model")
    ap_train.add_argument("--stores", required=True, help="path to stores.json")
    ap_train.add_argument("--out", default="ai/models", help="output dir for model artifacts")
    ap_train.add_argument("--max-sites", type=int, default=300, help="max sites to use")
    ap_train.add_argument("--timeout", type=int, default=15, help="per-request timeout (seconds)")

    # predict
    ap_pred = sub.add_parser("predict", help="predict cuisine for a single URL")
    ap_pred.add_argument("--url", required=True, help="website URL to classify")
    ap_pred.add_argument("--timeout", type=int, default=15, help="per-request timeout (seconds)")
    ap_pred.add_argument("--model_dir", default="ai/models", help="directory with trained model")

    args = ap.parse_args()

    if args.cmd == "train":
        train_model(
            stores_path=args.stores,
            out_dir=args.out,
            max_sites=args.max_sites,
            timeout=args.timeout,
        )
    elif args.cmd == "predict":
        res = predict_url(args.url, timeout=args.timeout, model_dir=args.model_dir)
        print(json.dumps(res))
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
