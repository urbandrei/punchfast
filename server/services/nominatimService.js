/**
 * Nominatim API Service
 *
 * Wrapper for OpenStreetMap's Nominatim geocoding API
 * - Geocoding: Convert address to coordinates
 * - Reverse Geocoding: Convert coordinates to address
 *
 * Rate Limit: 1 request per second (we use 1.5s interval in background service)
 * Documentation: https://nominatim.org/release-docs/latest/api/Overview/
 */

const { countryNameToCode, stateNameToCode } = require('../utils/geocodingUtils');

const NOMINATIM_CONFIG = {
    BASE_URL: 'https://nominatim.openstreetmap.org',
    USER_AGENT: 'PunchFast/1.0 (contact@punchfast.com)',
    TIMEOUT: 10000,  // 10 seconds
    REQUEST_INTERVAL: 1500,  // 1.5 seconds between requests
};

/**
 * Build a query string from store address components
 * @param {Object} store - Store object with address fields
 * @returns {string} - Formatted address query
 */
function buildAddressQuery(store) {
    const parts = [];

    // Add address components in order: house number, street, city, state, postcode, country
    if (store.addr_housenumber) parts.push(store.addr_housenumber);
    if (store.addr_street) parts.push(store.addr_street);
    if (store.addr_city) parts.push(store.addr_city);
    if (store.addr_state) parts.push(store.addr_state);
    if (store.addr_postcode) parts.push(store.addr_postcode);
    if (store.addr_country) parts.push(store.addr_country);

    return parts.join(', ');
}

/**
 * Geocode address to coordinates using Nominatim search API
 *
 * @param {Object} store - Store object with address fields
 * @returns {Promise<{latitude: number, longitude: number}|null>} - Coordinates or null if not found
 */
async function geocodeAddress(store) {
    const query = buildAddressQuery(store);

    if (!query) {
        console.warn('[Nominatim] Cannot geocode: no address components available');
        return null;
    }

    const url = `${NOMINATIM_CONFIG.BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), NOMINATIM_CONFIG.TIMEOUT);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': NOMINATIM_CONFIG.USER_AGENT
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Nominatim API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            console.warn(`[Nominatim] No results found for address: ${query}`);
            return null;
        }

        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            console.warn('[Nominatim] Invalid coordinates in response');
            return null;
        }

        console.log(`[Nominatim] ✓ Geocoded "${query}" → (${latitude}, ${longitude})`);
        return { latitude, longitude };

    } catch (error) {
        const errorMsg = error.name === 'AbortError' ? 'timeout' : error.message;
        console.error(`[Nominatim] Geocoding failed for "${query}": ${errorMsg}`);
        return null;
    }
}

/**
 * Reverse geocode coordinates to address using Nominatim reverse API
 *
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object|null>} - Address components or null if not found
 */
async function reverseGeocode(latitude, longitude) {
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        console.warn('[Nominatim] Cannot reverse geocode: invalid coordinates');
        return null;
    }

    const url = `${NOMINATIM_CONFIG.BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), NOMINATIM_CONFIG.TIMEOUT);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': NOMINATIM_CONFIG.USER_AGENT
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Nominatim API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.address) {
            console.warn(`[Nominatim] No address found for coordinates: (${latitude}, ${longitude})`);
            return null;
        }

        const addr = data.address;

        // Convert country name to code first (needed for state conversion context)
        const countryCode = addr.country ? countryNameToCode(addr.country) : null;

        // Convert state name to code (uses country context for disambiguation)
        const stateCode = addr.state ? stateNameToCode(addr.state, countryCode) : null;

        // Map Nominatim response to our store address fields
        const addressComponents = {
            addr_housenumber: addr.house_number || null,
            addr_street: addr.road || addr.street || null,
            addr_city: addr.city || addr.town || addr.village || null,
            addr_state: stateCode,
            addr_postcode: addr.postcode || null,
            addr_country: countryCode,
            // Build full address string
            address: data.display_name || 'unknown'
        };

        console.log(`[Nominatim] ✓ Reverse geocoded (${latitude}, ${longitude}) → ${addressComponents.addr_city}, ${addressComponents.addr_country}`);
        return addressComponents;

    } catch (error) {
        const errorMsg = error.name === 'AbortError' ? 'timeout' : error.message;
        console.error(`[Nominatim] Reverse geocoding failed for (${latitude}, ${longitude}): ${errorMsg}`);
        return null;
    }
}

module.exports = {
    geocodeAddress,
    reverseGeocode,
    NOMINATIM_CONFIG
};
