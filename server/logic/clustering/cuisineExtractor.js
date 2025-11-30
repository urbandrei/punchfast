function extractCuisines(store) {
    const cuisines = new Set();

    if (store.cuisine) {
        store.cuisine.split(';').forEach(c => {
            cuisines.add(c.trim().toLowerCase());
        });
    }

    if (cuisines.size === 0) {
        if (store.amenity) {
            cuisines.add(store.amenity.toLowerCase());
        } else if (store.shop) {
            cuisines.add(store.shop.toLowerCase());
        }
    }

    return Array.from(cuisines);
}

function groupStoresByCuisine(stores) {
    const cuisineMap = new Map();

    for (const store of stores) {
        const cuisines = extractCuisines(store);

        for (const cuisine of cuisines) {
            if (!cuisineMap.has(cuisine)) {
                cuisineMap.set(cuisine, []);
            }
            cuisineMap.get(cuisine).push(store);
        }
    }

    return cuisineMap;
}

function normalizeCuisineType(cuisine) {
    return cuisine
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

module.exports = {
    extractCuisines,
    groupStoresByCuisine,
    normalizeCuisineType
};
