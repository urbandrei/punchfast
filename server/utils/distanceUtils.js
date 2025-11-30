function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const O1 = lat1 * Math.PI / 180;
    const O2 = lat2 * Math.PI / 180;
    const rad_lat = (lat2 - lat1) * Math.PI / 180;
    const rad_lon = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(rad_lat / 2) * Math.sin(rad_lat / 2) +
              Math.cos(O1) * Math.cos(O2) * Math.sin(rad_lon / 2) * Math.sin(rad_lon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
    return haversineDistance(lat1, lng1, lat2, lng2) * 1000;
}

function calculateCentroid(stores) {
    if (!stores || stores.length === 0) {
        return null;
    }

    let totalLat = 0;
    let totalLng = 0;

    for (const store of stores) {
        totalLat += parseFloat(store.latitude);
        totalLng += parseFloat(store.longitude);
    }

    return {
        latitude: totalLat / stores.length,
        longitude: totalLng / stores.length
    };
}

module.exports = {
    haversineDistance,
    haversineDistanceMeters,
    calculateCentroid
};
