import psycopg2
import pandas as pd
import os

# === Setup paths ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# === Connect to PostgreSQL ===
try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port="5432",
        database="punchfast",
        user="postgres",
        password="Rameez@123"
    )
    print("✅ Connected to PostgreSQL successfully.")
except Exception as e:
    print("❌ Database connection failed:")
    print(e)
    exit()

# === 1️⃣ Find stores with same coordinates (exact match) ===
query_exact_coords = """
SELECT
    ROUND(latitude::numeric, 5) AS lat,
    ROUND(longitude::numeric, 5) AS lon,
    COUNT(*) AS count
FROM food_places
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
GROUP BY 1, 2
HAVING COUNT(*) > 1;
"""

df_coords = pd.read_sql(query_exact_coords, conn)
print("\n🔍 Possible duplicate coordinates:")
print(df_coords.head())

# === 2️⃣ Find stores with very similar names (case-insensitive partial matches) ===
query_similar_names = """
SELECT a.id AS id1, b.id AS id2, a.name AS name1, b.name AS name2
FROM food_places a
JOIN food_places b ON LOWER(a.name) LIKE LOWER('%' || b.name || '%')
WHERE a.id < b.id
LIMIT 100;
"""

df_names = pd.read_sql(query_similar_names, conn)
print("\n🧾 Possible duplicate names:")
print(df_names.head())

# === 3️⃣ Export results ===
coord_path = os.path.join(DATA_DIR, "duplicate_coordinates.csv")
name_path = os.path.join(DATA_DIR, "duplicate_names.csv")

df_coords.to_csv(coord_path, index=False)
df_names.to_csv(name_path, index=False)

print(f"\n✅ Duplicate reports saved:")
print(f" - Coordinates: {coord_path}")
print(f" - Names: {name_path}")

# === Close connection ===
conn.close()
print("\n🎯 Duplicate search complete.")
