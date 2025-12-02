import os
import re
import difflib
import pandas as pd
import numpy as np

# ---------------- PATHS ----------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # from Scripts → project root
INPUT_PATH = os.path.join(BASE_DIR, "Data", "OSMFinalMerged.csv")
OUTPUT_SCORED = os.path.join(BASE_DIR, "Data", "OSMScoredStores.csv")
OUTPUT_REVIEW = os.path.join(BASE_DIR, "Data", "OSMStoresForReview.csv")

print(f"Loading data from: {INPUT_PATH}")
df = pd.read_csv(INPUT_PATH)


# ---------------- HELPERS ----------------

def get_col(name, default_value=0, to_str=False):
    if name in df.columns:
        col = df[name]
    else:
        col = pd.Series([default_value] * len(df), index=df.index)
    if to_str:
        return col.fillna("").astype(str).str.strip()
    return col.fillna(default_value)


def get_geo_col(name_candidates, default_value=""):
    for name in name_candidates:
        if name in df.columns:
            return get_col(name, default_value, to_str=True).str.lower()
    return pd.Series([default_value] * len(df), index=df.index)


def fuzzy_equal(a, b, threshold=0.85):
    a = (a or "").strip().lower()
    b = (b or "").strip().lower()
    if not a or not b:
        return False
    if a == b:
        return True
    return difflib.SequenceMatcher(None, a, b).ratio() >= threshold


# ---------------- RAW FIELDS ----------------

has_city          = get_col("HasCity", 0).astype(int)
has_street        = get_col("HasStreet", 0).astype(int)
has_house         = get_col("HasHouseNumber", 0).astype(int)
has_postcode      = get_col("HasPostcode", 0).astype(int)
has_website       = get_col("HasWebsite", 0).astype(int)
has_phone         = get_col("HasPhone", 0).astype(int)
has_opening       = get_col("HasOpeningHours", 0).astype(int)
has_cuisine_flag  = get_col("HasCuisine", 0).astype(int)
has_coords        = get_col("HasCoordinates", 0).astype(int)

days_since_update = get_col("DaysSinceUpdate", 9999).astype(int)
recently_updated  = get_col("RecentlyUpdated", 0).astype(int)

name              = get_col("Name", "", to_str=True)
name_norm         = get_col("NameNorm", "", to_str=True)
name_length       = get_col("NameLength", 0).astype(int)

amenity           = get_col("Amenity", "", to_str=True).str.lower()
shop              = get_col("Shop", "", to_str=True).str.lower()
cuisine           = get_col("Cuisine", "", to_str=True).str.lower()

city_osm          = get_col("City", "", to_str=True).str.lower()
street_osm        = get_col("Street", "", to_str=True).str.lower()
house_osm         = get_col("HouseNumber", "", to_str=True).str.lower()
postcode_osm      = get_col("Postcode", "", to_str=True).str.lower()

city_geo     = get_geo_col(["CityGeo", "Geo_CityGeo", "Geo_City"])
street_geo   = get_geo_col(["StreetGeo", "Geo_StreetGeo", "Geo_Street"])
house_geo    = get_geo_col(["HouseNumberGeo", "Geo_HouseNumberGeo", "Geo_HouseNumber"])
postcode_geo = get_geo_col(["PostcodeGeo", "Geo_PostcodeGeo", "Geo_Postcode"])


# ---------------- DERIVED FEATURES ----------------

# Food type
food_amenities = {"restaurant", "fast_food", "cafe", "bar", "pub", "ice_cream", "food_court"}
food_shops     = {"supermarket", "convenience", "bakery", "confectionery", "deli", "greengrocer"}
has_food_type  = amenity.isin(food_amenities) | shop.isin(food_shops)

# Cuisine richness
def count_cuisines(x: str) -> int:
    x = (x or "").strip()
    if not x:
        return 0
    return len([c for c in x.split(";") if c.strip() != ""])

cuisine_count = cuisine.apply(count_cuisines)

# Brand / chain detection
brand_keywords = [
    "mcdonald", "starbucks", "subway", "kfc", "taco bell", "pizza hut", "domino",
    "chipotle", "burger king", "wendy", "dunkin", "cold stone", "giant eagle",
    "aldi", "walmart", "circle k", "panera", "five guys", "sonic", "papa john",
    "wingstreet", "arby", "jimmy john", "little caesars", "tim hortons",
    "tgi friday", "golden corral"
]
pattern = "(?:" + "|".join(re.escape(b) for b in brand_keywords) + ")"
name_lower = name.str.lower()
is_chain = name_lower.str.contains(pattern, regex=True)

# Generic / suspicious names
generic_names = {"store", "shop", "restaurant", "cafe", "bar", "food"}
is_generic_name = (name_length < 3) | (name_lower.isin(generic_names))


# ---------------- SCORING ----------------

score = np.zeros(len(df), dtype=float)

# A) COMPLETENESS (max ~45)
score += 12 * has_coords
score += 7 * has_city
score += 7 * has_street
score += 5 * has_house
score += 5 * has_postcode
score += 3 * has_cuisine_flag
score += 3 * has_website
score += 3 * has_phone
score += 2 * has_opening

# B) FRESHNESS (max ~18)
fresh_score = np.zeros(len(df), dtype=float)

fresh_score += np.where(recently_updated == 1, 10, 0)
fresh_score += np.where((recently_updated == 0) & (days_since_update <= 365), 6, 0)
fresh_score += np.where(
    (recently_updated == 0) & (days_since_update > 365) & (days_since_update <= 3 * 365),
    3,
    0
)
fresh_score += np.where(days_since_update > 5 * 365, -4, 0)

score += fresh_score

# C) ADDRESS CONSISTENCY with fuzzy matching (max ~25)
# exact matches
city_exact     = (city_osm != "") & (city_geo != "") & (city_osm == city_geo)
postcode_match = (postcode_osm != "") & (postcode_geo != "") & (postcode_osm == postcode_geo)
street_exact   = (street_osm != "") & (street_geo != "") & (street_osm == street_geo)
house_match    = (house_osm != "") & (house_geo != "") & (house_osm == house_geo)

# fuzzy matches for city + street (if not exact)
city_soft = pd.Series(False, index=df.index)
street_soft = pd.Series(False, index=df.index)

for i in df.index:
    co, cg = city_osm.iat[i], city_geo.iat[i]
    so, sg = street_osm.iat[i], street_geo.iat[i]
    if not city_exact.iat[i] and co and cg:
        city_soft.iat[i] = fuzzy_equal(co, cg, threshold=0.85)
    if not street_exact.iat[i] and so and sg:
        street_soft.iat[i] = fuzzy_equal(so, sg, threshold=0.85)

addr_score = np.zeros(len(df), dtype=float)

# city: exact > fuzzy
addr_score += np.where(city_exact, 8, 0)
addr_score += np.where(~city_exact & city_soft, 5, 0)

# street: exact > fuzzy
addr_score += np.where(street_exact, 7, 0)
addr_score += np.where(~street_exact & street_soft, 4, 0)

# postcode + house: exact only
addr_score += np.where(postcode_match, 4, 0)
addr_score += np.where(house_match, 2, 0)

# all strong address bits align
all_exact_or_soft = (
    (city_exact | city_soft) &
    (street_exact | street_soft) &
    (postcode_match | (postcode_osm == "") | (postcode_geo == "")) &
    (house_match | (house_osm == "") | (house_geo == ""))
)
addr_score += np.where(all_exact_or_soft, 2, 0)

any_geo_present = (city_geo != "") | (street_geo != "") | (postcode_geo != "") | (house_geo != "")
no_matches = (
    ~city_exact & ~city_soft &
    ~street_exact & ~street_soft &
    ~postcode_match &
    ~house_match &
    any_geo_present
)
addr_score += np.where(no_matches, -5, 0)

score += addr_score

# D) NAME + TYPE QUALITY (max ~15)
name_quality = np.zeros(len(df), dtype=float)

name_quality += np.where((name_length >= 4) & (name_length <= 40), 4, 0)
name_quality += np.where(has_food_type, 4, 0)

name_quality += np.where(cuisine_count >= 2, 3, 0)
name_quality += np.where((cuisine != "") & (cuisine_count == 1), 2, 0)

# small chain bonus only
name_quality += np.where(is_chain, 2, 0)

score += name_quality

# E) PENALTIES / RED FLAGS (max ~ -23)
penalty = np.zeros(len(df), dtype=float)

penalty += np.where(has_coords == 0, -15, 0)
penalty += np.where((has_city == 0) & (has_street == 0), -8, 0)
penalty += np.where(
    (has_website == 0) & (has_phone == 0) & (has_opening == 0),
    -5,
    0
)
penalty += np.where(is_generic_name, -3, 0)

score += penalty


# ---------------- FINAL SCORE + STATUS ----------------

score = np.clip(score, 0, 100)
df["Score"] = score

# thresholds tuned so:
# - Valid = confident real
# - Review = grey zone
# - LikelyInvalid = truly weak
conditions = [
    df["Score"] >= 60,                       # confident real
    (df["Score"] >= 35) & (df["Score"] < 60),
    df["Score"] < 35
]
choices = ["Valid", "Review", "LikelyInvalid"]
df["Status"] = np.select(conditions, choices, default="Review")

# CHAIN ADJUSTMENT
mask_chain_upgrade = (
    is_chain &
    (df["Status"] == "LikelyInvalid") &
    (has_coords == 1) &
    ((has_city == 1) | (has_street == 1))
)
df.loc[mask_chain_upgrade, "Status"] = "Review"


# ---------------- SUMMARY + SAVE ----------------

print("\nStatus distribution:")
print(df["Status"].value_counts())

df.to_csv(OUTPUT_SCORED, index=False)

review_df = df[df["Status"].isin(["Review", "LikelyInvalid"])].copy()
review_df.to_csv(OUTPUT_REVIEW, index=False)

print(f"\nSaved scored data to: {OUTPUT_SCORED}")
print(f"Saved review list to: {OUTPUT_REVIEW}")