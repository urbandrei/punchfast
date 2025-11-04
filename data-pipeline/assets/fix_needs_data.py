import psycopg2
import requests
import time
import os

# === Database connection ===
try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port="5432",
        database="punchfast",
        user="postgres",
        password="Rameez@123"
    )
    cur = conn.cursor()
    print("✅ Connected to PostgreSQL successfully.")
except Exception as e:
    print("❌ Database connection failed:")
    print(e)
    exit()

# === Get rows needing fixes ===
cur.execute("""
    SELECT id, latitude, longitude, street, city, postcode
    FROM food_places
    WHERE status = 'needs_fix';
""")
rows = cur.fetchall()
print(f"🔎 Found {len(rows)} records that need fixing.")

# === Nominatim reverse geocoding ===
base_url = "https://nominatim.openstreetmap.org/reverse"

for r in rows:
    row_id, lat, lon, street, city, postcode = r

    if lat is None or lon is None:
        continue

    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
        "addressdetails": 1
    }

    try:
        res = requests.get(base_url, params=params, headers={"User-Agent": "PunchfastDataFix/1.0"})
        res.raise_for_status()
        data = res.json()

        address = data.get("address", {})
        new_street = address.get("road", street)
        new_city = address.get("city", address.get("town", address.get("village", city)))
        new_postcode = address.get("postcode", postcode)

        # === Update database record ===
        cur.execute("""
            UPDATE food_places
            SET street = %s, city = %s, postcode = %s, status = 'valid'
            WHERE id = %s;
        """, (new_street, new_city, new_postcode, row_id))

        print(f"✅ Updated ID {row_id}: {new_street}, {new_city}, {new_postcode}")
        conn.commit()

        # Delay to respect API rate limit (1 request/sec)
        time.sleep(1)

    except requests.exceptions.RequestException as e:
        print(f"⚠️ Network error for ID {row_id}: {e}")
        time.sleep(2)
        continue
    except Exception as e:
        print(f"⚠️ Unexpected error for ID {row_id}: {e}")
        continue

cur.close()
conn.close()
print("\n🎯 All updates complete and saved.")
