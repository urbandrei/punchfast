const { Search, Store } = require('../models/associations');

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
        const storeData = stores[i];
        let existingStore;

        // Use OSM ID for duplicate detection when available
        if (storeData.osm_id) {
            existingStore = await Store.findOne({
                where: {
                    osm_id: storeData.osm_id,
                    osm_type: storeData.osm_type
                }
            });
        } else {
            // Fallback to name+location for manually created stores
            existingStore = await Store.findOne({
                where: {
                    name: storeData.name,
                    latitude: storeData.latitude,
                    longitude: storeData.longitude
                }
            });
        }

        // Only create if store doesn't already exist
        if (!existingStore) {
            await Store.create(storeData);
        }
    }
}

async function convertData(data) {
    const stores = [];
    for(let i = 0; i < data.elements.length; i++) {
        const element = data.elements[i];

        // Skip elements without required fields
        if(!element.tags || !element.tags.name || !element.lat || !element.lon) {
            continue;
        }

        const tags = element.tags;

        // Preserve existing address construction logic
        let address = "unknown";
        if(tags["addr:housenumber"] && tags["addr:street"] &&
           tags["addr:city"] && tags["addr:state"] && tags["addr:postcode"]) {
            address = `${tags["addr:housenumber"]} ${tags["addr:street"]}, ${tags["addr:city"]}, ${tags["addr:state"]} ${tags["addr:postcode"]}`;
        }

        // Build store object with all OSM fields
        const store = {
            // Core identification
            osm_id: element.id || null,
            osm_type: element.type || null,

            // Required fields
            name: tags.name,
            latitude: element.lat,
            longitude: element.lon,

            // Classification
            amenity: tags.amenity || null,
            shop: tags.shop || null,

            // Address
            address: address,
            addr_housenumber: tags["addr:housenumber"] || null,
            addr_street: tags["addr:street"] || null,
            addr_city: tags["addr:city"] || null,
            addr_state: tags["addr:state"] || null,
            addr_postcode: tags["addr:postcode"] || null,
            addr_country: tags["addr:country"] || null,
            addr_unit: tags["addr:unit"] || null,
            addr_suite: tags["addr:suite"] || null,

            // Contact information
            phone: tags.phone || tags["contact:phone"] || null,
            email: tags.email || tags["contact:email"] || null,
            website: tags.website || tags["contact:website"] || null,
            contact_facebook: tags["contact:facebook"] || null,
            contact_instagram: tags["contact:instagram"] || null,
            contact_twitter: tags["contact:twitter"] || null,
            contact_youtube: tags["contact:youtube"] || null,
            website_menu: tags["website:menu"] || null,

            // Business hours & service
            opening_hours: tags.opening_hours || null,
            cuisine: tags.cuisine || null,
            brand: tags.brand || null,
            brand_wikidata: tags["brand:wikidata"] || null,
            operator: tags.operator || null,
            takeaway: tags.takeaway || null,
            delivery: tags.delivery || null,
            drive_through: tags.drive_through || null,
            drive_in: tags.drive_in || null,
            reservation: tags.reservation || null,
            smoking: tags.smoking || null,

            // Seating & facilities
            indoor_seating: tags.indoor_seating || null,
            outdoor_seating: tags.outdoor_seating || null,
            wheelchair: tags.wheelchair || null,
            toilets: tags.toilets || null,
            toilets_wheelchair: tags["toilets:wheelchair"] || null,
            highchair: tags.highchair || null,
            changing_table: tags.changing_table || null,
            internet_access: tags.internet_access || null,
            internet_access_fee: tags["internet_access:fee"] || null,
            air_conditioning: tags.air_conditioning || null,

            // Dietary & special
            diet_vegetarian: tags["diet:vegetarian"] || null,
            diet_vegan: tags["diet:vegan"] || null,
            diet_gluten_free: tags["diet:gluten_free"] || null,
            diet_halal: tags["diet:halal"] || null,
            diet_kosher: tags["diet:kosher"] || null,
            lgbtq: tags.lgbtq || null,
            bar: tags.bar || null,

            // Payment methods
            payment_cash: tags["payment:cash"] || null,
            payment_credit_cards: tags["payment:credit_cards"] || null,
            payment_debit_cards: tags["payment:debit_cards"] || null,
            payment_contactless: tags["payment:contactless"] || null,
            payment_mobile: tags["payment:mobile"] || null,

            // Metadata
            check_date: tags.check_date || null,
            source: tags.source || null,
            notes: tags.note || tags.notes || null,

            // Status
            status: 'active'
        };

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
