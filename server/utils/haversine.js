/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} unit - Unit of measurement: 'km' or 'm' (default: 'm')
 * @returns {number} Distance in specified unit
 */
function calculateDistance(lat1, lon1, lat2, lon2, unit = 'm') {
    const R = unit === 'km' ? 6371 : 6371000; // Earth radius in km or meters
    const O1 = lat1 * Math.PI / 180;
    const O2 = lat2 * Math.PI / 180;
    const rad_lat = (lat2 - lat1) * Math.PI / 180;
    const rad_lon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(rad_lat / 2) * Math.sin(rad_lat / 2) +
              Math.cos(O1) * Math.cos(O2) *
              Math.sin(rad_lon / 2) * Math.sin(rad_lon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

module.exports = { calculateDistance };
