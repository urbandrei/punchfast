// Proximity detection and localStorage utilities for visit notifications

// ============================================================================
// 1. Distance Calculation (Haversine Formula)
// ============================================================================

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Returns distance in meters
};

// ============================================================================
// 2. Local Storage Management
// ============================================================================

const STORAGE_KEYS = {
  SAVED_STORES: 'pf_saved_stores_cache',
  VISIT_DENIALS: 'pf_visit_denials',
  DAILY_VISITS: 'pf_daily_visits',
  STARTING_LOCATION: 'pf_starting_location'
};

// Save stores with coordinates to localStorage
export const cacheNearbyStores = (stores, startingLocation) => {
  const storeData = stores.map(store => ({
    id: store.id,
    name: store.name,
    latitude: parseFloat(store.latitude),
    longitude: parseFloat(store.longitude),
    address: store.address,
    isVerified: store.isVerified
  }));

  localStorage.setItem(STORAGE_KEYS.SAVED_STORES, JSON.stringify(storeData));
  localStorage.setItem(STORAGE_KEYS.STARTING_LOCATION, JSON.stringify(startingLocation));
};

// Get cached stores
export const getCachedStores = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SAVED_STORES);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Error reading cached stores:', err);
    return [];
  }
};

// Get starting location
export const getStartingLocation = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STARTING_LOCATION);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    return null;
  }
};

// ============================================================================
// 3. Denial Management (with hourly expiration)
// ============================================================================

export const addVisitDenial = (storeId) => {
  try {
    const denials = getVisitDenials();
    const now = Date.now();
    denials[storeId] = {
      timestamp: now,
      expiresAt: now + (60 * 60 * 1000) // 1 hour from now
    };
    localStorage.setItem(STORAGE_KEYS.VISIT_DENIALS, JSON.stringify(denials));
  } catch (err) {
    console.error('Error saving denial:', err);
  }
};

export const getVisitDenials = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VISIT_DENIALS);
    if (!stored) return {};

    const denials = JSON.parse(stored);
    const now = Date.now();

    // Filter out expired denials
    const validDenials = {};
    Object.entries(denials).forEach(([storeId, data]) => {
      if (data.expiresAt > now) {
        validDenials[storeId] = data;
      }
    });

    // Update storage with cleaned denials
    if (Object.keys(validDenials).length !== Object.keys(denials).length) {
      localStorage.setItem(STORAGE_KEYS.VISIT_DENIALS, JSON.stringify(validDenials));
    }

    return validDenials;
  } catch (err) {
    console.error('Error reading denials:', err);
    return {};
  }
};

export const isDenied = (storeId) => {
  const denials = getVisitDenials();
  return denials.hasOwnProperty(storeId);
};

// ============================================================================
// 4. Daily Visit Tracking
// ============================================================================

export const markVisitedToday = (storeId) => {
  try {
    const visits = getDailyVisits();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    visits[storeId] = { date: today, visited: true };
    localStorage.setItem(STORAGE_KEYS.DAILY_VISITS, JSON.stringify(visits));
  } catch (err) {
    console.error('Error marking visit:', err);
  }
};

export const getDailyVisits = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_VISITS);
    if (!stored) return {};

    const visits = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];

    // Filter out old visits (not today)
    const todayVisits = {};
    Object.entries(visits).forEach(([storeId, data]) => {
      if (data.date === today) {
        todayVisits[storeId] = data;
      }
    });

    // Update storage if cleaned
    if (Object.keys(todayVisits).length !== Object.keys(visits).length) {
      localStorage.setItem(STORAGE_KEYS.DAILY_VISITS, JSON.stringify(todayVisits));
    }

    return todayVisits;
  } catch (err) {
    console.error('Error reading daily visits:', err);
    return {};
  }
};

export const hasVisitedToday = (storeId) => {
  const visits = getDailyVisits();
  return visits.hasOwnProperty(storeId) && visits[storeId].visited;
};

// ============================================================================
// 5. Proximity Detection
// ============================================================================

const PROXIMITY_THRESHOLD_METERS = 15;

export const findNearbyStores = (currentLocation, cachedStores) => {
  if (!currentLocation || !cachedStores || cachedStores.length === 0) {
    return [];
  }

  return cachedStores
    .map(store => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        store.latitude,
        store.longitude
      );
      return { ...store, distance };
    })
    .filter(store => store.distance <= PROXIMITY_THRESHOLD_METERS)
    .sort((a, b) => a.distance - b.distance); // Closest first
};

export const filterEligibleStores = (nearbyStores) => {
  const denials = getVisitDenials();
  const dailyVisits = getDailyVisits();

  return nearbyStores.filter(store => {
    // Skip if denied in last hour
    if (isDenied(store.id)) return false;

    // Skip if already visited today
    if (hasVisitedToday(store.id)) return false;

    return true;
  });
};

// ============================================================================
// 6. Refresh Detection
// ============================================================================

export const shouldRefreshStoreList = (currentLocation, cachedStores, startingLocation) => {
  if (!currentLocation || !startingLocation || !cachedStores || cachedStores.length === 0) {
    return false;
  }

  // Calculate maximum distance from starting location to any cached store
  const maxStoreDist = Math.max(
    ...cachedStores.map(store =>
      calculateDistance(
        startingLocation.lat,
        startingLocation.lng,
        store.latitude,
        store.longitude
      )
    )
  );

  // Calculate current distance from starting location
  const currentDist = calculateDistance(
    startingLocation.lat,
    startingLocation.lng,
    currentLocation.lat,
    currentLocation.lng
  );

  // Refresh if user is beyond furthest cached store
  return currentDist > maxStoreDist;
};
