import psycopg2
import os

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

print("\n🔗 Ensuring 'master_id' column exists...")

# === 1️⃣ Add master_id column if it doesn't exist ===
cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'food_places'
          AND column_name = 'master_id'
    ) THEN
        ALTER TABLE food_places ADD COLUMN master_id INTEGER;
    END IF;
END
$$;
""")
conn.commit()
print("🧱 master_id column verified or created.")

print("\n🧮 Computing duplicate groups by rounded coordinates...")

# === 2️⃣ Compute and update duplicates ===
cur.execute("""
WITH dup_groups AS (
    SELECT
        ROUND(latitude::numeric, 5) AS lat_r,
        ROUND(longitude::numeric, 5) AS lon_r,
        MIN(id) AS master_id,
        COUNT(*) AS cnt
    FROM food_places
    WHERE latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND status != 'rejected'
    GROUP BY 1, 2
    HAVING COUNT(*) > 1
),
to_update AS (
    SELECT fp.id, dg.master_id
    FROM food_places fp
    JOIN dup_groups dg
      ON ROUND(fp.latitude::numeric, 5) = dg.lat_r
     AND ROUND(fp.longitude::numeric, 5) = dg.lon_r
)
UPDATE food_places f
SET
    master_id = u.master_id,
    status = CASE
        WHEN f.id = u.master_id THEN f.status
        ELSE 'duplicate'
    END
FROM to_update u
WHERE f.id = u.id;
""")

updated = cur.rowcount
conn.commit()
print(f"✅ Merging complete. Rows updated: {updated}")

# === 3️⃣ Show post-merge status summary ===
cur.execute("""
SELECT status, COUNT(*) 
FROM food_places
GROUP BY status
ORDER BY status;
""")

rows = cur.fetchall()
print("\n📊 Status counts after merge:")
for status, count in rows:
    print(f"  {status}: {count}")

cur.close()
conn.close()
print("\n🎯 Duplicate merging process finished successfully.")
