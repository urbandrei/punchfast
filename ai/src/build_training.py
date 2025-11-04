import json, os, argparse, re, pandas as pd, yaml, io
import tldextract

def _coerce_records(obj):
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict):
        for key in ("elements", "features", "data", "stores"):
            if key in obj and isinstance(obj[key], list):
                return obj[key]
    if isinstance(obj, str):
        records = []
        for line in io.StringIO(obj):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                if isinstance(rec, dict):
                    records.append(rec)
            except Exception:
                pass
        if records:
            return records
    return []

def load_stores(path: str) -> pd.DataFrame:
    raw = open(path, "r", encoding="utf-8").read()
    try:
        parsed = json.loads(raw)
    except Exception:
        parsed = raw
    records = _coerce_records(parsed)
    if not records:
        raise ValueError(f"Could not parse any store records from {path}")

    rows = []
    for el in records:
        if not isinstance(el, dict):
            continue
        tags = el.get("tags", {})
        if not isinstance(tags, dict):
            tags = {}
        rows.append({
            "id": el.get("id"),
            "lat": el.get("lat"),
            "lon": el.get("lon"),
            "name": tags.get("name", el.get("name", "")),
            "brand": tags.get("brand", el.get("brand", "")),
            "website": tags.get("website", el.get("website", "")),
            "amenity": tags.get("amenity", el.get("amenity", "")),
            "shop": tags.get("shop", el.get("shop", "")),
            "cuisine_raw": tags.get("cuisine", el.get("cuisine", "")),
            "opening_hours": tags.get("opening_hours", el.get("opening_hours", "")),
        })
    return pd.DataFrame(rows)

def map_type(df: pd.DataFrame, type_map_path: str) -> pd.Series:
    with open(type_map_path, "r", encoding="utf-8") as f:
        mp = yaml.safe_load(f)
    amenity_map, shop_map = mp.get("amenity", {}), mp.get("shop", {})
    types = []
    for a, s in zip(df["amenity"], df["shop"]):
        if a and a in amenity_map: types.append(amenity_map[a])
        elif s and s in shop_map: types.append(shop_map[s])
        else: types.append("")
    return pd.Series(types, index=df.index)

def normalize_cuisine(series: pd.Series, cuisine_map_path: str):
    with open(cuisine_map_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    aliases = cfg.get("aliases", {})
    delim = cfg.get("multi_label_delimiter", ";")
    out = []
    for val in series.fillna("").astype(str).tolist():
        labs = []
        tokens = re.split(rf"\s*{re.escape(delim)}\s*", val.strip().lower()) if val else []
        for token in tokens:
            token = token.strip()
            if not token:
                continue
            labs.append(aliases.get(token, token))
        out.append(sorted(list(set(labs))))
    return out

def domain_tokens(u):
    try:
        ext = tldextract.extract(u or "")
        host = ".".join([p for p in [ext.subdomain, ext.domain, ext.suffix] if p])
        return re.sub(r"[^a-z0-9]+", " ", host.lower()).strip()
    except Exception:
        return ""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--type_map", default="ai/src/taxonomy/type_map.yaml")
    ap.add_argument("--cuisine_map", default="ai/src/taxonomy/cuisine_map.yaml")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    df = load_stores(args.input)
    if df.empty:
        raise ValueError("No rows parsed from stores input.")

    df["store_type_label"] = map_type(df, args.type_map)
    df["cuisine_labels"] = normalize_cuisine(df["cuisine_raw"], args.cuisine_map)
    df["domain_tokens"] = df["website"].apply(domain_tokens)
    df["text_seed"] = (df["name"].fillna("") + " " + df["brand"].fillna("") + " " + df["domain_tokens"].fillna("")).str.strip()

    df.to_csv(os.path.join(args.out, "stores_full.csv"), index=False)
    df[df["cuisine_labels"].apply(len)>0].to_csv(os.path.join(args.out, "train_cuisine.csv"), index=False)
    df[df["store_type_label"].astype(str).str.len()>0].to_csv(os.path.join(args.out, "train_type.csv"), index=False)
    print("Wrote:", args.out)

if __name__ == "__main__":
    main()
