import pandas as pd
import os

# === Setup paths ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

input_csv = os.path.join(DATA_DIR, "Portage_Food_Places.csv")
output_csv = os.path.join(DATA_DIR, "Portage_Food_Places_Classified.csv")

# === Load the cleaned data ===
try:
    df = pd.read_csv(input_csv)
    print(f"📂 Loaded data from: {input_csv}")
except FileNotFoundError:
    print(f"❌ Error: Could not find {input_csv}")
    exit()

# === Classification rules ===
def classify(row):
    # Reject if missing name
    if not row["Name"] or pd.isna(row["Name"]):
        return "rejected"

    # Reject if missing coordinates
    if not row["Latitude"] or not row["Longitude"]:
        return "rejected"

    # Needs fixing if missing street
    if not row["Street"] or pd.isna(row["Street"]):
        return "needs_fix"

    # Otherwise valid
    return "valid"

# === Apply classification ===
df["Status"] = df.apply(classify, axis=1)

# === Save updated CSV ===
df.to_csv(output_csv, index=False, encoding="utf-8")

print(f"✅ Classified data saved to: {output_csv}")
print("\n📊 Classification summary:")
print(df["Status"].value_counts())
