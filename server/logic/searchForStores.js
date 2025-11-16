const { Search, Store } = require('../models/associations');
const auth = require("../middleware/auth");

function getBoundingSquare(centerLat, centerLng, radiusKm) {
	if (radiusKm <= 0) {
		console.error("Radius must be positive.");
		return null;
	}

	const EARTH_RADIUS_KM = 6371;

	const deltaLatRad = radiusKm / EARTH_RADIUS_KM;
	const deltaLatDeg = deltaLatRad * (180 / Math.PI);

	const minLat = centerLat - deltaLatDeg;
	const maxLat = centerLat + deltaLatDeg;

	const centerLatRad = centerLat * (Math.PI / 180);

	let minLng, maxLng;

	if (Math.abs(centerLat) >= 90) {
		minLng = -180;
		maxLng = 180;
	} else {
		const deltaLngRad = radiusKm / (EARTH_RADIUS_KM * Math.cos(centerLatRad));
		const deltaLngDeg = deltaLngRad * (180 / Math.PI);

		minLng = centerLng - deltaLngDeg;
		maxLng = centerLng + deltaLngDeg;
	}

	const clampedMinLat = Math.max(-90, minLat);
	const clampedMaxLat = Math.min(90, maxLat);

	return {
		bottomLeft: { lat: clampedMinLat, lng: minLng },
		topRight: { lat: clampedMaxLat, lng: maxLng },
  	};
}

function subtractBox(boxA, boxB) {
	const [ax1, ay1] = boxA[0];
	const [ax2, ay2] = boxA[1];
	const [bx1, by1] = boxB[0];
	const [bx2, by2] = boxB[1];
	const ix1 = Math.max(ax1, bx1);
	const iy1 = Math.max(ay1, by1);
	const ix2 = Math.min(ax2, bx2);
	const iy2 = Math.min(ay2, by2);

	if (ix1 >= ix2 || iy1 >= iy2) return [boxA];
	const r = [];
	if (iy2 < ay2) r.push([[ax1, iy2], [ax2, ay2]]);
	if (ay1 < iy1) r.push([[ax1, ay1], [ax2, iy1]]);
	if (ax1 < ix1) r.push([[ax1, iy1], [ix1, iy2]]);
	if (ix2 < ax2) r.push([[ix2, iy1], [ax2, iy2]]);
	return r;
}

function getRemainderBoxes(originals, target) {
	if (!target) return [];
	let remainders = [target];
	for (const o of originals) {
		let next = [];
		for (const r of remainders) {
			next.push(...subtractBox(r, o));
		}
		remainders = next;
	}
	return remainders;
}

function boxToArray(box) {
	return [
		[box.bottomLeft.lng, box.bottomLeft.lat],
		[box.topRight.lng, box.topRight.lat]
	];
}

function arrayToBox(arr) {
	return {
		bottomLeft: { lat: arr[0][1], lng: arr[0][0] },
		topRight: { lat: arr[1][1], lng: arr[1][0] }
	};
}

async function searchWithBoundingBox(centerLat, centerLng, radiusKm) {
	const newBoundingBox = getBoundingSquare(centerLat, centerLng, radiusKm);

	if (!newBoundingBox) {
		return { error: 'Invalid radius' };
	}

	const existingSearches = await Search.findAll();

	const existingBoxes = existingSearches.map(search => [
		[search.minLongitude, search.minLatitude],
		[search.maxLongitude, search.maxLatitude]
	]);

	const targetBox = boxToArray(newBoundingBox);

	const remainderBoxes = getRemainderBoxes(existingBoxes, targetBox);

	await Search.create({
		minLatitude: newBoundingBox.bottomLeft.lat,
		minLongitude: newBoundingBox.bottomLeft.lng,
		maxLatitude: newBoundingBox.topRight.lat,
		maxLongitude: newBoundingBox.topRight.lng
	});

	return {
		newBoundingBox,
		remainderBoxes: remainderBoxes.map(arrayToBox),
		remainderBoxesRaw: remainderBoxes
	};
}

async function getStoresFromOsm(lowerLeftCoords, upperRightCoords) {
    const overpassUrl = "https://overpass-api.de/api/interpreter";

    const [minLat, minLon] = lowerLeftCoords;
    const [maxLat, maxLon] = upperRightCoords;

    const bbox = `(${minLat},${minLon},${maxLat},${maxLon})`;

    const overpassQuery = `
    [out:json];
    (
      node["amenity"~"cafe|fast_food|restaurant|bar|pub"]${bbox};
      way["amenity"~"cafe|fast_food|restaurant|bar|pub"]${bbox};
      relation["amenity"~"cafe|fast_food|restaurant|bar|pub"]${bbox};
      node["shop"~"bakery|convenience|deli|coffee|ice_cream"]${bbox};
      way["shop"~"bakery|convenience|deli|coffee|ice_cream"]${bbox};
      relation["shop"~"bakery|convenience|deli|coffee|ice_cream"]${bbox};
    );
    out center;
    `;

    try {
        const response = await fetch(overpassUrl, {
            method: 'POST',
            body: overpassQuery
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Overpass API error response:", errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        return data;

    } catch (error) {
        console.error(`An error occurred with the API request: ${error.message}`);
        return null;
    }
}

async function dataIngestion(stores) {
    for(let i=0; i<stores.length; i++) {
        const name = stores[i].name;
        const address = stores[i].address;
        const latitude = stores[i].latitude;
        const longitude = stores[i].longitude;

        const existingStore = await Store.findOne({
            where: { name, latitude, longitude }
        });

        if (!existingStore) {
            await Store.create({ name, address, latitude, longitude });
        }
    }
}

async function convertData(data) {
    const stores = [];
    for(let i = 0; i < data.elements.length; i++) {
        if(!data.elements[i].tags || !data.elements[i].tags.name || !data.elements[i].lat || !data.elements[i].lon) {
            continue;
        }
        let store;
        if(!data.elements[i].tags["addr:housenumber"] || !data.elements[i].tags["addr:street"] || !data.elements[i].tags["addr:city"] || !data.elements[i].tags["addr:state"] || !data.elements[i].tags["addr:postcode"]) {
            store = {
                name:data.elements[i].tags.name,
                address:"unknown",
                latitude:data.elements[i].lat,
                longitude:data.elements[i].lon
            };
        } else {
            store = {
                name:data.elements[i].tags.name,
                address:data.elements[i].tags["addr:housenumber"] + " " + data.elements[i].tags["addr:street"] + ", " + data.elements[i].tags["addr:city"] + ", " + data.elements[i].tags["addr:state"] + " " + data.elements[i].tags["addr:postcode"],
                latitude:data.elements[i].lat,
                longitude:data.elements[i].lon
            };
        }
        stores.push(store);
    }
    await dataIngestion(stores);
}

async function searchAndAddStores(centerLat, centerLng, radiusKm) {
	const result = await searchWithBoundingBox(centerLat, centerLng, radiusKm);

	if (result.error) {
		return { error: result.error };
	}

	const remainderBoxes = result.remainderBoxesRaw;

	let totalStoresAdded = 0;
	const results = [];

	for (const box of remainderBoxes) {
		const [[minLng, minLat], [maxLng, maxLat]] = box;

		const osmData = await getStoresFromOsm([minLat, minLng], [maxLat, maxLng]);

		if (osmData && osmData.elements && osmData.elements.length > 0) {
			await convertData(osmData);
			results.push({
				box: { minLat, minLng, maxLat, maxLng },
				storesFound: osmData.elements.length
			});
			totalStoresAdded += osmData.elements.length;
		}
	}

	return {
		newBoundingBox: result.newBoundingBox,
		remainderBoxes: result.remainderBoxes,
		searchResults: results,
		totalStoresFound: totalStoresAdded
	};
}

module.exports = {
	searchAndAddStores
};
