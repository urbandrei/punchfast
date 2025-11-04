import os, json, argparse, joblib, re, pandas as pd, numpy as np
from typing import Dict, Any, List
from ai.src.utils.text_utils import normalize_whitespace, tokenize_domain, keyword_hits
from ai.src.utils.scrape_site import scrape_site
import pathlib

GAZETTEER_PATH = pathlib.Path(__file__).parent / "gazetteer" / "brand_gazetteer.json"
with open(GAZETTEER_PATH, "r", encoding="utf-8") as f:
  GAZ = json.load(f)

def brand_cuisine_from_name(name: str) -> List[str]:
  name = (name or "").lower()
  labs = set()
  for b, tags in GAZ.get("brands", {}).items():
    if b in name: labs.update(tags)
  labs.update(keyword_hits(name, GAZ.get("name_keywords", {})))
  return sorted(labs)

def tokens_from_url(url: str) -> str:
  toks = tokenize_domain(url)
  return " ".join(toks)

def build_text(store: Dict[str, Any], scraped: Dict[str, Any]) -> str:
  seed = " ".join([
    store.get("name",""), store.get("brand",""), tokens_from_url(store.get("website","")),
    scraped.get("title",""), scraped.get("meta_desc",""), scraped.get("text",""),
    " ".join(scraped.get("jsonld_types",[])), " ".join(scraped.get("jsonld_menu_items",[]))
  ])
  return normalize_whitespace(seed)

def apply_type_rules(tags: Dict[str, Any], type_map_path: str) -> str:
  import yaml
  with open(type_map_path, "r", encoding="utf-8") as f:
    mp = yaml.safe_load(f)
  a, s = (tags.get("amenity") or "").strip(), (tags.get("shop") or "").strip()
  if a and a in mp.get("amenity", {}): return mp["amenity"][a]
  if s and s in mp.get("shop", {}):   return mp["shop"][s]
  return ""

def load_models(models_dir: str):
  type_model = joblib.load(os.path.join(models_dir, "type_model.joblib")) if os.path.exists(os.path.join(models_dir, "type_model.joblib")) else None
  cuisine_model = joblib.load(os.path.join(models_dir, "cuisine_model.joblib"))
  cuisine_mlb   = joblib.load(os.path.join(models_dir, "cuisine_mlb.joblib"))
  return type_model, cuisine_model, cuisine_mlb

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--stores", required=True)
  ap.add_argument("--models", required=True)
  ap.add_argument("--out", required=True)
  ap.add_argument("--type_map", default="ai/src/taxonomy/type_map.yaml")
  ap.add_argument("--scrape", action="store_true")
  args = ap.parse_args()

  type_model, cuisine_model, cuisine_mlb = load_models(args.models)
  with open(args.stores, "r", encoding="utf-8") as f:
    data = json.load(f)

  enriched = []
  for el in data:
    tags = el.get("tags", {})
    store = {
      "id": el.get("id"), "lat": el.get("lat"), "lon": el.get("lon"),
      "name": tags.get("name",""), "brand": tags.get("brand",""),
      "website": tags.get("website",""), "amenity": tags.get("amenity",""),
      "shop": tags.get("shop",""), "cuisine": tags.get("cuisine","") or ""
    }

    # TYPE
    type_rule = apply_type_rules(store, args.type_map)
    type_pred, type_conf, type_source = "", 0.0, ""
    if type_rule:
      type_pred, type_conf, type_source = type_rule, 1.0, "osm_rule"
    elif type_model is not None:
      scraped = {"title":"", "meta_desc":"", "text":"", "jsonld_types":[], "jsonld_menu_items":[]}
      if args.scrape and store["website"]:
        scraped = scrape_site(store["website"])
      text = " ".join([store.get("name",""), store.get("brand",""), store.get("website",""), scraped.get("title","")]).strip()
      type_pred = type_model.predict([text])[0]
      try:
        proba = type_model.predict_proba([text])[0]
        classes = list(type_model.classes_)
        type_conf = float(proba[classes.index(type_pred)])
      except Exception:
        type_conf = 0.6
      type_source = "model"

    # CUISINE
    cuisine_source, cuisine_pred, cuisine_conf = "", [], []
    if store["cuisine"]:
      cuisine_source = "osm_rule"
      cuisine_pred = [c.strip() for c in re.split(r"[;,\|]+", store["cuisine"].lower()) if c.strip()]
      cuisine_conf = [1.0]*len(cuisine_pred)
    else:
      hints = brand_cuisine_from_name((store.get("name") or "") + " " + (store.get("brand") or ""))
      scraped = {"title":"", "meta_desc":"", "text":"", "jsonld_types":[], "jsonld_menu_items":[]}
      if args.scrape and store["website"]:
        scraped = scrape_site(store["website"])
        hints = sorted(set(hints + brand_cuisine_from_name(" ".join([scraped.get("title",""), scraped.get("meta_desc","")]))))
      text = build_text(store, scraped)
      scores = cuisine_model.decision_function([text])
      probs = 1 / (1 + np.exp(-scores))  # sigmoid
      probs = probs[0]
      classes = list(cuisine_mlb.classes_)
      keep = [(c, float(p)) for c, p in zip(classes, probs) if p >= 0.6]
      hints_set = set(hints)
      for c in hints_set:
        if c not in [k for k,_ in keep]:
          keep.append((c, 0.9))
      keep = sorted(keep, key=lambda x: x[1], reverse=True)[:5]
      cuisine_pred = [k for k,_ in keep]
      cuisine_conf = [v for _,v in keep]
      if cuisine_pred:
        cuisine_source = "model"

    enriched_tags = dict(tags)
    if type_pred:
      enriched_tags["type_pred"] = type_pred
      enriched_tags["type_conf"] = round(type_conf, 3)
      enriched_tags["type_source"] = type_source
    if cuisine_pred:
      enriched_tags["cuisine_pred"] = cuisine_pred
      enriched_tags["cuisine_conf"] = [round(x,3) for x in cuisine_conf]
      enriched_tags["cuisine_source"] = cuisine_source

    out_el = dict(el)
    out_el["tags"] = enriched_tags
    enriched.append(out_el)

  with open(args.out, "w", encoding="utf-8") as f:
    json.dump(enriched, f, ensure_ascii=False, indent=2)
  print("Wrote:", args.out, "Total:", len(enriched))

if __name__ == "__main__":
  main()
