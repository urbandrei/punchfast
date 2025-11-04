import pandas as pd
import folium
from folium.plugins import MarkerCluster, HeatMap, Search
import os

# === Setup paths ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
output_map = os.path.join(BASE_DIR, "punchfast_verified_map_pro.html")

# === Load data ===
print("📂 Loading data...")
input_csv = os.path.join(DATA_DIR, "final_clean_food_places.csv")

try:
    df = pd.read_csv(input_csv)
except FileNotFoundError:
    print(f"❌ File not found at: {input_csv}")
    exit()

valid_df = df[df["status"] == "valid"].copy()
invalid_df = df[df["status"] != "valid"].copy()

print(f"✅ Loaded {len(df)} total records ({len(valid_df)} valid, {len(invalid_df)} non-valid).")

# === Create base map ===
print("🗺️ Creating base map...")
m = folium.Map(location=[41.15, -81.25], zoom_start=10, tiles="CartoDB positron")

# === Color mapping ===
color_map = {
    "pizza": "orange",
    "chinese": "red",
    "cafe": "blue",
    "coffee": "blue",
    "bakery": "pink",
    "mexican": "purple",
    "indian": "darkred",
    "italian": "cadetblue",
    "japanese": "lightgreen",
    "thai": "darkpurple",
    "american": "darkblue",
    "vegan": "lightgray",
    "bbq": "black",
    "ice cream": "lightpink",
    "dessert": "lightpink",
    "other": "green"
}

def get_marker_color(cuisine):
    if isinstance(cuisine, str):
        cuisine_lower = cuisine.lower()
        for key, color in color_map.items():
            if key in cuisine_lower:
                return color
    return "green"

# === Add clustered markers ===
print("📍 Adding clustered markers for valid stores...")
marker_cluster = MarkerCluster(name="Verified Stores").add_to(m)

for _, row in valid_df.iterrows():
    popup_html = f"""
    <div style="font-family:Arial; font-size:13px;">
        <b>{row['name']}</b><br>
        <i>{row['cuisine'] or 'Unknown cuisine'}</i><br>
        {row['street'] or ''}, {row['city'] or ''}<br>
        {'<a href="'+str(row['website'])+'" target="_blank">🌐 Website</a>' if pd.notna(row['website']) and str(row['website']).strip() else ''}
    </div>
    """
    folium.Marker(
        [row["latitude"], row["longitude"]],
        tooltip=row["name"],
        popup=popup_html,
        icon=folium.Icon(color=get_marker_color(row["cuisine"]), icon="cutlery", prefix="fa")
    ).add_to(marker_cluster)

# === Add non-valid stores ===
print("📍 Adding non-valid stores...")
for _, row in invalid_df.iterrows():
    folium.CircleMarker(
        [row["latitude"], row["longitude"]],
        radius=4,
        color="gray",
        fill=True,
        fill_opacity=0.4,
        popup=f"<b>{row['name']}</b> (Needs fix / Rejected)"
    ).add_to(m)

# === Add heatmap ===
print("🔥 Adding heatmap...")
if not valid_df.empty:
    HeatMap(valid_df[['latitude', 'longitude']], radius=15, blur=12, min_opacity=0.4).add_to(m)

# === Add search bar ===
print("🔍 Adding search bar...")
Search(
    layer=marker_cluster,
    search_label="name",
    placeholder="Search for a restaurant...",
    collapsed=False
).add_to(m)

# === Add legend ===
legend_html = """
<div style="
position: fixed;
bottom: 50px; left: 50px;
width: 250px;
background-color: white;
border: 2px solid grey;
z-index: 9999;
font-size: 13px;
padding: 10px;">
<b>🍴 Cuisine Legend</b><br>
<hr>
<b>Common Paths</b><br>
<i style='color:orange;'>●</i> Pizza<br>
<i style='color:red;'>●</i> Chinese<br>
<i style='color:blue;'>●</i> Cafe / Coffee<br>
<i style='color:pink;'>●</i> Bakery<br>
<i style='color:purple;'>●</i> Mexican<br>
<hr>
<b>Regional / Ethnic</b><br>
<i style='color:darkred;'>●</i> Indian<br>
<i style='color:cadetblue;'>●</i> Italian<br>
<i style='color:lightgreen;'>●</i> Japanese<br>
<i style='color:darkpurple;'>●</i> Thai<br>
<i style='color:darkblue;'>●</i> American<br>
<hr>
<b>Specialty</b><br>
<i style='color:lightgray;'>●</i> Vegan / Healthy<br>
<i style='color:black;'>●</i> BBQ / Grill<br>
<i style='color:lightpink;'>●</i> Ice Cream / Dessert<br>
<i style='color:green;'>●</i> Other<br>
</div>
"""
m.get_root().html.add_child(folium.Element(legend_html))

# === Save output ===
m.save(output_map)
print(f"\n🎯 Interactive map generated successfully!")
print(f"👉 Open '{output_map}' in your browser.")
