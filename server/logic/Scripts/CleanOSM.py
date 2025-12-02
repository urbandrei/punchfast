import json
from pathlib import Path
from datetime import datetime, timezone

import pandas as pd

# Paths (adjust if needed)
input_path = Path("Data/OSMFoodRaw.json")
output_path = Path("Data/OSMCleanedData.csv")

with input_path.open("r", encoding="utf-8") as f:
    raw = json.load(f)

rows = []

for el in raw.get("elements", []):
    tags = el.get("tags", {})

    name = tags.get("name")
    if not name:
        continue

    # coordinates (node or way/relation center)
    lat = el.get("lat")
    lon = el.get("lon")
    if lat is None or lon is None:
        center = el.get("center", {})
        lat = center.get("lat")
        lon = center.get("lon")
    if lat is None or lon is None:
        continue

    city = (
        tags.get("addr:city")
        or tags.get("addr:town")
        or tags.get("addr:village")
    )
    street = tags.get("addr:street")
    housenumber = tags.get("addr:housenumber")
    postcode = tags.get("addr:postcode")

    website = (
        tags.get("website")
        or tags.get("contact:website")
        or tags.get("url")
    )
    phone = tags.get("phone") or tags.get("contact:phone")
    opening_hours = tags.get("opening_hours")
    cuisine = tags.get("cuisine")
    amenity = tags.get("amenity")
    shop = tags.get("shop")
    osm_id = el.get("id")
    ts_raw = el.get("timestamp")

    rows.append(
        {
            "OsmId": osm_id,
            "Name": name,
            "Amenity": amenity,
            "Shop": shop,
            "Cuisine": cuisine,
            "City": city,
            "Street": street,
            "HouseNumber": housenumber,
            "Postcode": postcode,
            "Website": website,
            "Phone": phone,
            "OpeningHours": opening_hours,
            "Latitude": lat,
            "Longitude": lon,
            "OsmTimestamp": ts_raw,
        }
    )

df = pd.DataFrame(rows)

# Drop dupes on name + coords
df = df.drop_duplicates(subset=["Name", "Latitude", "Longitude"]).reset_index(drop=True)

# Light cleaning
for col in ["Name", "City", "Street"]:
    df[col] = df[col].astype("string").str.strip()

df["Postcode"] = (
    df["Postcode"]
    .astype("string")
    .str.strip()
    .replace({"<NA>": None, "nan": None})
)

# Normalized name + length
df["NameNorm"] = df["Name"].str.lower()
df["NameLength"] = df["Name"].fillna("").str.len().astype(int)

# Presence flags (0/1)
for col in [
    "City",
    "Street",
    "HouseNumber",
    "Postcode",
    "Website",
    "Phone",
    "OpeningHours",
    "Cuisine",
]:
    df[f"Has{col}"] = df[col].notna().astype(int)

df["HasCoordinates"] = df[["Latitude", "Longitude"]].notna().all(axis=1).astype(int)

# Timestamp → recency features
def parse_ts(ts):
    try:
        return pd.to_datetime(ts, utc=True)
    except Exception:
        return pd.NaT

df["OsmTimestampParsed"] = df["OsmTimestamp"].apply(parse_ts)

now = datetime.now(timezone.utc)
df["DaysSinceUpdate"] = (now - df["OsmTimestampParsed"]).dt.days
df["RecentlyUpdated"] = df["DaysSinceUpdate"].le(365).fillna(False).astype(int)

# Final column order
cols = [
    "OsmId",
    "Name",
    "Amenity",
    "Shop",
    "Cuisine",
    "City",
    "Street",
    "HouseNumber",
    "Postcode",
    "Website",
    "Phone",
    "OpeningHours",
    "Latitude",
    "Longitude",
    "OsmTimestamp",
    "OsmTimestampParsed",
    "DaysSinceUpdate",
    "RecentlyUpdated",
    "NameNorm",
    "NameLength",
    "HasCity",
    "HasStreet",
    "HasHouseNumber",
    "HasPostcode",
    "HasWebsite",
    "HasPhone",
    "HasOpeningHours",
    "HasCuisine",
    "HasCoordinates",
]

df = df[cols]

output_path.parent.mkdir(parents=True, exist_ok=True)
df.to_csv(output_path, index=False)

print(f"Saved cleaned data to {output_path}")
print(f"Rows: {len(df)}, Columns: {len(df.columns)}")