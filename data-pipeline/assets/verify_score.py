import psycopg2
import requests
import time
import csv
import os
from datetime import datetime

# === Setup paths ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "docs")
os.makedirs(DOCS_DIR, exist_ok=True)

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

# === Ensure columns exist ===
cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='food_places' AND column_name='verification_score'
    ) THEN
        ALTER TABLE food_places ADD COLUMN verification_score INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='food_places' AND column_name='verified'
    ) THEN
        ALTER TABLE food_places ADD COLUMN verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
""")
conn.commit()
print("🧱 Verified 'verification_score' and 'verified' columns.")

# === Fetch valid stores ===
cur.execute("""
SELECT id, name, website, latitude, longitude
FROM food_places
WHERE status='valid';
""")
rows = cur.fetchall()
print(f"🧩 Found {len(rows)} stores to score.")

# === Prepare CSV log ===
log_filename = os.path.join(DOCS_DIR, f"verification_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
log_fields = ["id", "name", "website", "website_active", "osm_exists", "score", "verified", "verification_reason"]
log_rows = []

# === Main verification loop ===
for row in rows:
    store_id, name, website, lat, lon = row
    score = 0
    website_active = False
    osm_exists = False
    reasons = []

    # 🌐 Website activity check
    if website and len(website.strip()) > 5:
        try:
            url = website if website.startswith(("http://", "https://")) else "https://" + website
            res = requests.get(url, timeout=5, headers={"User-Agent": "PunchFastVerifier/1.0"})
            if res.status_code == 200:
                website_active = True
                score += 3
                reasons.append("Website active")
                print(f"✅ Website active for {name}")
            else:
                reasons.append(f"Website inactive ({res.status_code})")
                print(f"⚠️ Website inactive for {name} ({res.status_code})")
        except requests.exceptions.RequestException as e:
            reasons.append("Website check failed")
            print(f"❌ Website check failed for {name}: {e}")

    # 🗺️ OSM existence check
    try:
        if lat and lon:
            nominatim_url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "format": "json",
                "lat": lat,
                "lon": lon,
                "zoom": 18,
                "addressdetails": 1
            }
            r = requests.get(nominatim_url, params=params, headers={"User-Agent": "PunchFastVerifier/1.0"})
            r.raise_for_status()
            data = r.json()
            if "osm_type" in data and "osm_id" in data:
                osm_exists = True
                score += 2
                reasons.append("Found in OSM")
                print(f"🗺️ OSM record found for {name}")
            else:
                reasons.append("Not found in OSM")
    except requests.exceptions.RequestException as e:
        reasons.append("OSM check failed")
        print(f"⚠️ OSM check failed for {name}: {e}")

    # Future extension: user check-ins, reviews, etc.
    # if user_verified: score += 5; reasons.append("User verified")

    verified = score >= 5
    reasons.append("High confidence (>=5)" if verified else "Low verification score")

    # === Update database record ===
    cur.execute("""
        UPDATE food_places
        SET verification_score = %s,
            verified = %s
        WHERE id = %s;
    """, (score, verified, store_id))

    # === Add row to CSV log ===
    log_rows.append({
        "id": store_id,
        "name": name,
        "website": website,
        "website_active": website_active,
        "osm_exists": osm_exists,
        "score": score,
        "verified": verified,
        "verification_reason": ", ".join(reasons)
    })

    # Respect API limits (Nominatim policy)
    time.sleep(1)

# === Commit updates and close DB ===
conn.commit()
cur.close()
conn.close()

# === Write verification log ===
with open(log_filename, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=log_fields)
    writer.writeheader()
    writer.writerows(log_rows)

print(f"\n🎯 Verification scoring complete. Log saved to: {log_filename}")
