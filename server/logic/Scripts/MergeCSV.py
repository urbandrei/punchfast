import pandas as pd

# Load base cleaned OSM data
osm = pd.read_csv("Data/OSMCleanedData.csv")

# Load reverse geocoded file
geo = pd.read_csv("Data/OSMReverseGeocoded.csv")

# Safety check — both must match row-by-row
if len(osm) != len(geo):
    raise ValueError("Row count mismatch between OSMCleanedData.csv and OSMReverseGeocoded.csv")

# Add prefix to every reverse-geocode column except key alignment
geo = geo.add_prefix("Geo_")

# Geo_ReverseAddressGeo is a dict-like column, keep as string
if "Geo_ReverseAddressGeo" in geo.columns:
    geo["Geo_ReverseAddressGeo"] = geo["Geo_ReverseAddressGeo"].astype(str)

# Merge by index (because both files were processed row-aligned)
merged = pd.concat([osm, geo], axis=1)

# Save final merged dataset
merged.to_csv("Data/OSMFinalMerged.csv", index=False)

print("Merged file saved as Data/OSMFinalMerged.csv")
print("Final column count:", len(merged.columns))