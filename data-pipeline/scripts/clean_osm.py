import json
import pandas as pd
import os

# === Set up base directories ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# === Load raw OSM JSON ===
json_path = os.path.join(DATA_DIR, "export.json")

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# === Extract relevant features ===
places = []
for el in data.get("elements", []):
    tags = el.get("tags", {})
    if "name" in tags:
        places.append({
            "Name": tags.get("name", ""),
            "Type": tags.get("amenity", tags.get("shop", "")),
            "Cuisine": tags.get("cuisine", ""),
            "City": tags.get("addr:city", ""),
            "Street": tags.get("addr:street", ""),
            "Postcode": tags.get("addr:postcode", ""),
            "Website": tags.get("website", ""),
            "Latitude": el.get("lat", ""),
            "Longitude": el.get("lon", "")
        })

# === Convert to DataFrame and export ===
df = pd.DataFrame(places)

output_csv = os.path.join(DATA_DIR, "Portage_Food_Places.csv")
df.to_csv(output_csv, index=False, encoding="utf-8")

print(f"✅ CSV exported successfully: {output_csv}")
print(f"Total places extracted: {len(df)}")
