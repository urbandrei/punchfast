import argparse, os, joblib, pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    df = pd.read_csv(os.path.join(args.data, "train_type.csv"))
    X = df["text_seed"].fillna("")
    y = df["store_type_label"].astype(str)

    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1,3), min_df=2, max_df=0.9)),
        ("clf", LogisticRegression(max_iter=2000, class_weight="balanced"))
    ])
    pipe.fit(Xtr, ytr)
    print(classification_report(yte, pipe.predict(Xte)))
    joblib.dump(pipe, os.path.join(args.out, "type_model.joblib"))

if __name__ == "__main__":
    main()
