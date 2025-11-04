# PunchFast Data Pipeline

A complete end-to-end data cleaning, verification, and visualization system for restaurant and store data in **Portage County, Ohio**.

---

## 🧭 Overview

This repository contains the **data engineering and verification pipeline** for **PunchFast**, a local business rewards application focused on food places (restaurants, cafés, and bakeries) across Portage County.

The project:
- Extracts raw geospatial business data from **OpenStreetMap (OSM)**.
- Cleans and classifies it.
- Loads it into a **PostgreSQL** database.
- Verifies and deduplicates records.
- Generates an **interactive map** with store-level information and confidence scoring.

The goal is to ensure data reliability, consistency, and geo-validity before integration into the production PunchFast app.

---

## ⚙️ Pipeline Workflow

The pipeline follows an **Extract → Transform → Load → Verify → Visualize** structure.

### 1. Extract – Raw Data Collection
- Pulled all restaurant, café, and bakery records from **OpenStreetMap (OSM)** using **Overpass Turbo** queries.
- Exported results as `export.json`.
- Used `clean_osm.py` to convert JSON into a structured CSV (`Portage_Food_Places.csv`).

### 2. Transform – Cleaning and Classification
- `classify_stores.py` standardizes and tags businesses as:
  - **valid** – clean, usable data  
  - **needs_fix** – missing address or website  
  - **rejected** – irrelevant or unusable entries
- Output: `Portage_Food_Places_Classified.csv`

### 3. Load – Database Integration
- Created a **PostgreSQL** database (`punchfast`).
- `insert_to_postgres.py` automatically creates and populates the `food_places` table.
- Verified data insertion via **pgAdmin**.

### 4. Fix – Missing Data Recovery
- `fix_needs_data.py` uses a **reverse-geocoding API** to fill missing address fields based on coordinates.
- Retrieves nearest **street, city, and postcode** automatically.

### 5. Verify – Authenticity and Online Presence
- `verify_stores.py` and `verify_score.py` check whether each store’s **website** is reachable.
- Integrated into a **scoring model (0–5)**:
  - 1–2 → weak confidence  
  - 3–4 → moderate  
  - 5 → fully verified
- Assigns “verified” or “not verified” labels.

### 6. Detect and Merge Duplicates
- `find_duplicates.py` identifies duplicates based on:
  - Exact coordinates
  - Similar names
- `merge_duplicates.py` merges them and assigns a `master_id`.

### 7. Export – Final Clean Dataset
Outputs:
- `final_clean_food_places.csv` → fully verified dataset  
- `verification_log_*.csv` → detailed verification results

### 8. Visualize – Interactive Mapping
- `map_visualization_pro.py` creates an **interactive Folium map** with:
  - Clustered markers
  - Heatmap of restaurant density
  - Color-coded cuisine markers
  - Search functionality and legend
- Output: `punchfast_verified_map_pro.html`

---

## 📊 Example Outputs

**Final Map:**  
Interactive visualization with clustered points, colored cuisine markers, pop-ups, and a heatmap layer.

**Final Dataset:**  
`final_clean_food_places.csv`  
Contains:  
`id, name, type, cuisine, city, street, postcode, website, latitude, longitude, status, master_id`

---

Running the Pipeline

python Scripts/insert_to_postgres.py
python Scripts/fix_needs_data.py
python Scripts/find_duplicates.py
python Scripts/merge_duplicates.py
python Scripts/verify_score.py
python Scripts/map_visualization_pro.py

Viewing the Map

Open: "punchfast_verified_map_pro.html" in your browser.

---

## Repository Structure

```plaintext
punchfast-data-pipeline/
│
├── data/
│   ├── export.json
│   ├── Portage_Food_Places.csv
│   ├── Portage_Food_Places_Classified.csv
│   ├── duplicate_coordinates.csv
│   ├── duplicate_names.csv
│   └── final_clean_food_places.csv
│
├── docs/
│   ├── website_verification_log_*.csv
│   ├── verification_log_*.csv
│   └── (future logs or reports)
│
├── Scripts/
│   ├── clean_osm.py
│   ├── classify_stores.py
│   ├── insert_to_postgres.py
│   ├── find_duplicates.py
│   ├── merge_duplicates.py
│   ├── fix_needs_data.py
│   ├── verify_stores.py
│   ├── verify_score.py
│   └── map_visualization.py
│
├── requirements.txt
├── README.md
└── punchfast_verified_map_pro.html

