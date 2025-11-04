import pandas as pd
import psycopg2
import os

# === Setup paths ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

input_csv = os.path.join(DATA_DIR, "Portage_Food_Places_Classified.csv")

# === Load the classified CSV ===
try:
    df = pd.read_csv(input_csv)
    print(f"📂 Loaded data from: {input_csv}")
except FileNotFoundError:
    print(f"❌ Error: File not found at {input_csv}")
    exit()

# === Connect to PostgreSQL ===
try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        database="punchfast",
        user="postgres",         # change if using a different username
        password="Rameez@123",   # replace with your actual password
        port="5432"
    )
    print("✅ Connected to PostgreSQL successfully.")
except Exception as e:
    print("❌ Connection failed:")
    print(e)
    exit()

cur = conn.cursor()

# === Create table if it doesn't exist ===
cur.execute("""
CREATE TABLE IF NOT EXISTS food_places (
    id SERIAL PRIMARY KEY,
    name TEXT,
    type TEXT,
    cuisine TEXT,
    city TEXT,
    street TEXT,
    postcode TEXT,
    website TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT
);
""")
print("🧱 Table verified or created.")

# === Insert data safely ===
insert_query = """
    INSERT INTO food_places
    (name, type, cuisine, city, street, postcode, website, latitude, longitude, status)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

count = 0
for _, row in df.iterrows():
    try:
        cur.execute(insert_query, (
            row["Name"], row["Type"], row["Cuisine"], row["City"],
            row["Street"], row["Postcode"], row["Website"],
            row["Latitude"], row["Longitude"], row["Status"]
        ))
        count += 1
    except Exception as e:
        print(f"⚠️ Skipped a row due to error: {e}")

conn.commit()
cur.close()
conn.close()

print(f"✅ Inserted {count} rows into 'food_places' in database 'punchfast'.")
