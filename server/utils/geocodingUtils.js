/**
 * Geocoding Utilities Module
 *
 * Converts full geographic names to 2-letter codes (ISO 3166-1 alpha-2 for countries,
 * ISO 3166-2 for states/provinces).
 *
 * Features:
 * - Lazy loading of JSON mapping files
 * - In-memory caching for O(1) lookups
 * - Case-insensitive matching
 * - Handles accented characters and name variations
 * - Context-aware state conversion (uses country code)
 * - Logging for unmapped names (helps identify missing mappings)
 */

const path = require('path');

// Cached mapping objects (loaded lazily on first use)
let countryMap = null;
let usStatesMap = null;
let caProvincesMap = null;
let mxStatesMap = null;
let auStatesMap = null;
let deStatesMap = null;

// Path to geocoding data directory
const DATA_DIR = path.join(__dirname, '../data/geocoding');

/**
 * Normalize name for lookup
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes extra spaces
 *
 * @param {string} name - Name to normalize
 * @returns {string} - Normalized name
 */
function normalizeName(name) {
    if (!name || typeof name !== 'string') {
        return '';
    }

    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');  // Replace multiple spaces with single space
}

/**
 * Load and cache country mapping from JSON file
 * @returns {Object} - Country name to code mapping
 */
function loadCountryMap() {
    if (!countryMap) {
        try {
            const rawMap = require(path.join(DATA_DIR, 'countries.json'));

            // Create lowercase-key version for case-insensitive lookup
            countryMap = {};
            for (const [name, code] of Object.entries(rawMap)) {
                const normalized = normalizeName(name);
                if (normalized) {
                    countryMap[normalized] = code;
                }
            }
        } catch (error) {
            console.error('[Geocoding] Failed to load countries.json:', error.message);
            countryMap = {};
        }
    }
    return countryMap;
}

/**
 * Load and cache US states mapping from JSON file
 * @returns {Object} - US state name to code mapping
 */
function loadUSStatesMap() {
    if (!usStatesMap) {
        try {
            const rawMap = require(path.join(DATA_DIR, 'us-states.json'));

            usStatesMap = {};
            for (const [name, code] of Object.entries(rawMap)) {
                const normalized = normalizeName(name);
                if (normalized) {
                    usStatesMap[normalized] = code;
                }
            }
        } catch (error) {
            console.error('[Geocoding] Failed to load us-states.json:', error.message);
            usStatesMap = {};
        }
    }
    return usStatesMap;
}

/**
 * Load and cache Canadian provinces mapping from JSON file
 * @returns {Object} - Canadian province name to code mapping
 */
function loadCAProvincesMap() {
    if (!caProvincesMap) {
        try {
            const rawMap = require(path.join(DATA_DIR, 'ca-provinces.json'));

            caProvincesMap = {};
            for (const [name, code] of Object.entries(rawMap)) {
                const normalized = normalizeName(name);
                if (normalized) {
                    caProvincesMap[normalized] = code;
                }
            }
        } catch (error) {
            console.error('[Geocoding] Failed to load ca-provinces.json:', error.message);
            caProvincesMap = {};
        }
    }
    return caProvincesMap;
}

/**
 * Load and cache Mexican states mapping from JSON file
 * @returns {Object} - Mexican state name to code mapping
 */
function loadMXStatesMap() {
    if (!mxStatesMap) {
        try {
            const rawMap = require(path.join(DATA_DIR, 'mx-states.json'));

            mxStatesMap = {};
            for (const [name, code] of Object.entries(rawMap)) {
                const normalized = normalizeName(name);
                if (normalized) {
                    mxStatesMap[normalized] = code;
                }
            }
        } catch (error) {
            console.error('[Geocoding] Failed to load mx-states.json:', error.message);
            mxStatesMap = {};
        }
    }
    return mxStatesMap;
}

/**
 * Load and cache Australian states mapping from JSON file
 * @returns {Object} - Australian state name to code mapping
 */
function loadAUStatesMap() {
    if (!auStatesMap) {
        try {
            const rawMap = require(path.join(DATA_DIR, 'au-states.json'));

            auStatesMap = {};
            for (const [name, code] of Object.entries(rawMap)) {
                const normalized = normalizeName(name);
                if (normalized) {
                    auStatesMap[normalized] = code;
                }
            }
        } catch (error) {
            console.error('[Geocoding] Failed to load au-states.json:', error.message);
            auStatesMap = {};
        }
    }
    return auStatesMap;
}

/**
 * Load and cache German states mapping from JSON file
 * @returns {Object} - German state name to code mapping
 */
function loadDEStatesMap() {
    if (!deStatesMap) {
        try {
            const rawMap = require(path.join(DATA_DIR, 'de-states.json'));

            deStatesMap = {};
            for (const [name, code] of Object.entries(rawMap)) {
                const normalized = normalizeName(name);
                if (normalized) {
                    deStatesMap[normalized] = code;
                }
            }
        } catch (error) {
            console.error('[Geocoding] Failed to load de-states.json:', error.message);
            deStatesMap = {};
        }
    }
    return deStatesMap;
}

/**
 * Convert country name to ISO 3166-1 alpha-2 code
 *
 * @param {string} countryName - Full country name from Nominatim
 * @returns {string|null} - 2-letter country code or null if not found
 *
 * @example
 * countryNameToCode('United States') // → 'US'
 * countryNameToCode('France') // → 'FR'
 * countryNameToCode('US') // → 'US' (idempotent)
 * countryNameToCode(null) // → null
 */
function countryNameToCode(countryName) {
    // Handle null/undefined/empty
    if (!countryName || typeof countryName !== 'string') {
        return null;
    }

    // If already a 2-letter code, validate and return
    if (countryName.length === 2) {
        const upper = countryName.toUpperCase();
        const map = loadCountryMap();
        const normalized = normalizeName(upper);
        if (map[normalized] === upper) {
            return upper;
        }
    }

    // Normalize and lookup
    const normalized = normalizeName(countryName);
    if (!normalized) {
        return null;
    }

    const map = loadCountryMap();
    const code = map[normalized];

    if (!code) {
        console.warn(`[Geocoding] Unknown country: "${countryName}"`);
        return null;
    }

    return code;
}

/**
 * Convert state/province name to 2-letter code (context-aware)
 *
 * Uses country code to determine which state mapping to use.
 * If no country provided, tries US states first, then falls back to other countries.
 *
 * @param {string} stateName - State/province name from Nominatim
 * @param {string} countryCode - Country code for context (US, CA, MX, AU, DE, etc.)
 * @returns {string|null} - 2-letter state code or null if not found
 *
 * @example
 * stateNameToCode('California', 'US') // → 'CA'
 * stateNameToCode('Ontario', 'CA') // → 'ON'
 * stateNameToCode('New York') // → 'NY' (assumes US)
 * stateNameToCode(null) // → null
 */
function stateNameToCode(stateName, countryCode) {
    // Handle null/undefined/empty
    if (!stateName || typeof stateName !== 'string') {
        return null;
    }

    // If already a 2-letter code, just return uppercase
    if (stateName.length === 2) {
        return stateName.toUpperCase();
    }

    const normalized = normalizeName(stateName);
    if (!normalized) {
        return null;
    }

    let code = null;

    // Use country code to determine which mapping to check
    if (countryCode === 'US') {
        const map = loadUSStatesMap();
        code = map[normalized];
    } else if (countryCode === 'CA') {
        const map = loadCAProvincesMap();
        code = map[normalized];
    } else if (countryCode === 'MX') {
        const map = loadMXStatesMap();
        code = map[normalized];
    } else if (countryCode === 'AU') {
        const map = loadAUStatesMap();
        code = map[normalized];
    } else if (countryCode === 'DE') {
        const map = loadDEStatesMap();
        code = map[normalized];
    } else {
        // No country code provided or unknown country
        // Try US first (most common), then other countries
        const usMap = loadUSStatesMap();
        code = usMap[normalized];

        if (!code) {
            const caMap = loadCAProvincesMap();
            code = caMap[normalized];
        }

        if (!code) {
            const mxMap = loadMXStatesMap();
            code = mxMap[normalized];
        }

        if (!code) {
            const auMap = loadAUStatesMap();
            code = auMap[normalized];
        }

        if (!code) {
            const deMap = loadDEStatesMap();
            code = deMap[normalized];
        }
    }

    if (!code) {
        console.warn(`[Geocoding] Unknown state: "${stateName}" (country: ${countryCode || 'unknown'})`);
        return null;
    }

    return code;
}

module.exports = {
    countryNameToCode,
    stateNameToCode,
    normalizeName
};
