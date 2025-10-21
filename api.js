const fs = require('fs');

async function getStoresFromOsm(lat, lon, radius_meters = 5000) {
    const overpassUrl = "https://overpass-api.de/api/interpreter";

    const overpassQuery = `
    [out:json];
    (
      node["amenity"~"cafe|fast_food|restaurant|bar|pub"](around:${radius_meters},${lat},${lon});
      way["amenity"~"cafe|fast_food|restaurant|bar|pub"](around:${radius_meters},${lat},${lon});
      relation["amenity"~"cafe|fast_food|restaurant|bar|pub"](around:${radius_meters},${lat},${lon});
      node["shop"~"bakery|convenience|deli|coffee|ice_cream"](around:${radius_meters},${lat},${lon});
      way["shop"~"bakery|convenience|deli|coffee|ice_cream"](around:${radius_meters},${lat},${lon});
      relation["shop"~"bakery|convenience|deli|coffee|ice_cream"](around:${radius_meters},${lat},${lon});
    );
    out center;
    `;

    try {
        const response = await fetch(overpassUrl, {
            method: 'POST',
            body: overpassQuery
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("Processing data...");

        
        return data;

    } catch (error) {
        console.error(`An error occurred with the API request: ${error.message}`);
        return null;
    }
}

function saveToJson(data, filename) {
    console.log(`Saving data to ${filename}...`);
    try {
        // Use JSON.stringify with indentation for a readable file
        const jsonData = JSON.stringify(data, null, 4);
        fs.writeFileSync(filename, jsonData, 'utf8');
        console.log("Successfully saved data.");
    } catch (error) {
        console.error(`An error occurred while saving the file: ${error.message}`);
    }
}


// Main execution function
async function main() {
    // Coordinates for Kent, Ohio
    const KENT_OHIO_LAT = 41.1439;
    const KENT_OHIO_LON = -81.3365;
    // Search radius in meters (e.g., 5000m = 5km)
    const SEARCH_RADIUS = 5000;
    const OUTPUT_FILENAME = 'stores.json';

    console.log(`Searching for stores within a ${SEARCH_RADIUS}m radius of Kent, Ohio...`);

    const stores = await getStoresFromOsm(KENT_OHIO_LAT, KENT_OHIO_LON, SEARCH_RADIUS);

        saveToJson(stores, OUTPUT_FILENAME);

}

// Run the main function
main();
