import psycopg2
import requests
import time
import os
from datetime import datetime
import csv

# === Setup directories ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(BASE_DIR, "docs")
os.makedirs(DOCS_DIR, exist_ok=True)

# === Connect to PostgreSQL ===
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

# === Fetch unverified stores with websites ===
cur.execute("""
    SELECT id, name, website
    FROM food_places
    WHERE website IS NOT NULL
      AND website <> ''
      AND verified = FALSE;
""")
rows = cur.fetchall()

print(f"🌐 Found {len(rows)} stores with websites to verify.")

# === Prepare CSV log ===
log_filename = os.path.join(DOCS_DIR, f"website_verification_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
log_fields = ["id", "name", "website", "status_code", "verified", "remarks"]
log_rows = []

# === Verify each store ===
for store_id, name, website in rows:
    verified = False
    status_code = None
    remarks = ""

    try:
        # Ensure proper URL format
        if not website.startswith(("http://", "https://")):
            website = "https://" + website

        res = requests.get(website, timeout=5, headers={"User-Agent": "PunchfastWebsiteVerifier/1.0"})
        status_code = res.status_code

        if res.status_code == 200:
            verified = True
            remarks = "Website active and reachable"
            print(f"✅ Verified: {name} ({website})")
        else:
            remarks = f"Website returned status {res.status_code}"
            print(f"⚠️ Unreachable ({res.status_code}): {website}")

        # Update database
        cur.execute("UPDATE food_places SET verified = %s WHERE id = %s;", (verified, store_id))
        conn.commit()

    except requests.exceptions.RequestException as e:
        remarks = f"Request failed: {e}"
        print(f"❌ Failed: {website} ({e})")
    except Exception as e:
        remarks = f"Unexpected error: {e}"
        print(f"⚠️ Error verifying {website}: {e}")

    # Add to log
    log_rows.append({
        "id": store_id,
        "name": name,
        "website": website,
        "status_code": status_code if status_code else "N/A",
        "verified": verified,
        "remarks": remarks
    })

    # Sleep to respect rate limits
    time.sleep(1)

# === Write log file ===
with open(log_filename, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=log_fields)
    writer.writeheader()
    writer.writerows(log_rows)

cur.close()
conn.close()

print(f"\n🎯 Verification process complete. Log saved to: {log_filename}")
