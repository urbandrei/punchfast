import argparse, os, ast, joblib, pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.multiclass import OneVsRestClassifier

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    df = pd.read_csv(os.path.join(args.data, "train_cuisine.csv"))
    # cuisine_labels column is like "['pizza','italian']" after CSV; parse it
    labels = df["cuisine_labels"].apply(lambda s: ast.literal_eval(s) if isinstance(s,str) else (s or []))
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(labels)
    X = df["text_seed"].fillna("")

    Xtr, Xte, Ytr, Yte = train_test_split(X, Y, test_size=0.25, random_state=42)
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=60000, ngram_range=(1,2))),
        ("clf", OneVsRestClassifier(LogisticRegression(max_iter=1000)))
    ])
    pipe.fit(Xtr, Ytr)
    try:
        Yp = pipe.predict(Xte)
        print(classification_report(Yte, Yp, zero_division=0))
        print("Labels:", mlb.classes_)
    except Exception:
        pass

    import joblib as jb
    jb.dump(pipe, os.path.join(args.out, "cuisine_model.joblib"))
    jb.dump(mlb,  os.path.join(args.out, "cuisine_mlb.joblib"))
    print("Saved:", os.path.join(args.out, "cuisine_model.joblib"))
    print("Saved:", os.path.join(args.out, "cuisine_mlb.joblib"))

if __name__ == "__main__":
    main()
