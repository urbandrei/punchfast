
#ONLY FOR VISUALIZATION OF DATA

#NOT A NECESSARY SCRIPT FILE

import pandas as pd
import folium

# Load data
df = pd.read_csv("Data/OSMScoredStores.csv")

# Base map (Portage County center)
m = folium.Map(location=[41.15, -81.35], zoom_start=11, tiles="CartoDB Positron")

# Custom icon URLs
icons = {
    "Valid": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    "Review": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    "LikelyInvalid": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
}

# Add markers
for _, r in df.iterrows():
    lat, lon = r["Latitude"], r["Longitude"]
    if pd.notna(lat) and pd.notna(lon):
        status = r["Status"]
        icon_url = icons.get(status, icons["Review"])

        icon = folium.features.CustomIcon(icon_url, icon_size=(30, 45))

        popup_html = f"""
        <b>{r['Name']}</b><br>
        <b>Status:</b> {status}<br>
        <b>Score:</b> {r['Score']}
        """

        folium.Marker(
            location=[lat, lon],
            icon=icon,
            popup=popup_html
        ).add_to(m)

# Add Legend
legend_html = """
<div style="
    position: fixed;
    bottom: 50px;
    left: 50px;
    width: 200px;
    height: 150px;
    background-color: white;
    border: 2px solid gray;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
    z-index: 9999;
">
<h4 style='margin-top:0;'>Legend</h4>
<img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" height="25"> Valid<br>
<img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png" height="25"> Needs Review<br>
<img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" height="25"> Likely Invalid<br>
</div>
"""

m.get_root().html.add_child(folium.Element(legend_html))

# Save
output = "Data/StoreStatusMap_Icons.html"
m.save(output)
print("Saved:", output)