const { calculateCentroid } = require('../../utils/distanceUtils');

const NOMINATIM_RATE_LIMIT_MS = 1000;
let lastNominatimRequest = 0;

function getClusterCenter(stores) {
    return calculateCentroid(stores);
}

function extractLocationFromNominatim(response) {
    if (!response || !response.address) {
        return null;
    }

    const address = response.address;

    if (address.neighbourhood) {
        return address.neighbourhood;
    }
    if (address.suburb) {
        return address.suburb;
    }
    if (address.hamlet) {
        return address.hamlet;
    }
    if (address.village) {
        return address.village;
    }
    if (address.town) {
        return address.town;
    }
    if (address.city) {
        return address.city;
    }
    if (address.county) {
        return address.county;
    }

    return null;
}

async function reverseGeocode(lat, lng) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastNominatimRequest;

    if (timeSinceLastRequest < NOMINATIM_RATE_LIMIT_MS) {
        await new Promise(resolve =>
            setTimeout(resolve, NOMINATIM_RATE_LIMIT_MS - timeSinceLastRequest)
        );
    }

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'PunchFast Route Clustering'
            }
        });

        lastNominatimRequest = Date.now();

        if (!response.ok) {
            console.warn(`[Clustering] Nominatim API error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return extractLocationFromNominatim(data);

    } catch (error) {
        console.warn(`[Clustering] Nominatim request failed: ${error.message}`);
        return null;
    }
}

async function getLocationName(lat, lng, cache = new Map()) {
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const location = await reverseGeocode(lat, lng);

    if (location) {
        cache.set(cacheKey, location);
    }

    return location;
}

function generateFallbackName(stores, cuisine) {
    if (!stores || stores.length === 0) {
        return `${capitalize(cuisine)} Cluster`;
    }

    const cities = stores
        .map(s => s.addr_city)
        .filter(city => city && city.trim() !== '');

    if (cities.length === 0) {
        return `Area ${capitalize(cuisine)} Cluster`;
    }

    const cityCount = new Map();
    for (const city of cities) {
        cityCount.set(city, (cityCount.get(city) || 0) + 1);
    }

    const mostCommonCity = Array.from(cityCount.entries())
        .reduce((max, entry) => entry[1] > max[1] ? entry : max, ['', 0])[0];

    return `${mostCommonCity} ${capitalize(cuisine)} Cluster`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function generateClusterName(cluster, cuisine, cache = new Map()) {
    if (!cluster || cluster.length === 0) {
        return `${capitalize(cuisine)} Cluster`;
    }

    const center = getClusterCenter(cluster);

    if (!center) {
        return generateFallbackName(cluster, cuisine);
    }

    try {
        const locationName = await getLocationName(
            center.latitude,
            center.longitude,
            cache
        );

        if (locationName) {
            return `${locationName} ${capitalize(cuisine)} Cluster`;
        }

        return generateFallbackName(cluster, cuisine);

    } catch (error) {
        console.warn(`[Clustering] Error generating cluster name: ${error.message}`);
        return generateFallbackName(cluster, cuisine);
    }
}

module.exports = {
    getLocationName,
    generateClusterName,
    getClusterCenter,
    extractLocationFromNominatim,
    generateFallbackName
};
