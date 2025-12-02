import pandas as pd
import time
import requests
from tqdm import tqdm

df = pd.read_csv("Data/OSMCleanedData.csv")

session = requests.Session()
headers = {"User-Agent": "PunchFastReverseGeocoder/1.0"}

def reverse_geocode(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
        "addressdetails": 1
    }
    try:
        r = session.get(url, params=params, headers=headers, timeout=5)
        a = r.json().get("address", {})
        return (
            a.get("city") or a.get("town") or a.get("village"),
            a.get("road"),
            a.get("house_number"),
            a.get("postcode"),
            a
        )
    except:
        return (None, None, None, None, None)

city_list = []
street_list = []
house_list = []
pc_list = []
addr_list = []

for i in tqdm(range(len(df)), desc="Reverse Geocoding", ncols=90):
    lat = df.loc[i, "Latitude"]
    lon = df.loc[i, "Longitude"]

    if pd.isna(lat) or pd.isna(lon):
        city_list.append(None)
        street_list.append(None)
        house_list.append(None)
        pc_list.append(None)
        addr_list.append(None)
        continue

    city, street, house, pc, full = reverse_geocode(lat, lon)

    city_list.append(city)
    street_list.append(street)
    house_list.append(house)
    pc_list.append(pc)
    addr_list.append(full)

    time.sleep(1)

df["CityGeo"] = city_list
df["StreetGeo"] = street_list
df["HouseNumberGeo"] = house_list
df["PostcodeGeo"] = pc_list
df["ReverseAddressGeo"] = addr_list

df.to_csv("Data/OSMReverseGeocoded.csv", index=False)
print("\nSaved: Data/OSMReverseGeocoded.csv")