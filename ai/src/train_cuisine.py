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
    df["cuisine_labels"] = df["cuisine_labels"].apply(lambda s: ast.literal_eval(s) if isinstance(s, str) else (s or []))
    X = df["text_seed"].fillna("")
    Y_list = df["cuisine_labels"].tolist()

    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(Y_list)

    Xtr, Xte, Ytr, Yte = train_test_split(X, Y, test_size=0.25, random_state=42)
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1,3), min_df=2, max_df=0.95)),
        ("clf", OneVsRestClassifier(LogisticRegression(max_iter=2000, class_weight="balanced")))
    ])
    pipe.fit(Xtr, Ytr)
    print("Labels:", mlb.classes_)
    print(classification_report(Yte, pipe.predict(Xte), target_names=mlb.classes_))

    joblib.dump(pipe, os.path.join(args.out, "cuisine_model.joblib"))
    joblib.dump(mlb,  os.path.join(args.out, "cuisine_mlb.joblib"))

if __name__ == "__main__":
    main()
