import psycopg2

conn = psycopg2.connect(
    host="127.0.0.1",
    port="5432",
    database="punchfast",
    user="postgres",
    password="Rameez@123"
)
cur = conn.cursor()

# Mark rows with duplicate coordinates
cur.execute("""
    UPDATE food_places
    SET status = 'duplicate'
    WHERE id IN (
        SELECT id FROM (
            SELECT id,
                   COUNT(*) OVER (PARTITION BY ROUND(latitude::numeric,5),
                                                 ROUND(longitude::numeric,5)) AS dupcount
            FROM food_places
        ) sub
        WHERE dupcount > 1
    );
""")

conn.commit()
cur.close()
conn.close()
print("✅ Marked duplicate coordinate entries in the database.")
