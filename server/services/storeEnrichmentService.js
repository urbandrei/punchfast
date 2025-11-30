/**
 * Store Enrichment Background Service
 *
 * Automatically enriches store data by:
 * - Adding coordinates when address is present (geocoding)
 * - Adding address when coordinates are present (reverse geocoding)
 * - Filling incomplete address fields (address completion)
 *
 * Runs asynchronously every 1.5 seconds, processing one store at a time
 */

const { Sequelize, Op } = require('sequelize');
const Store = require('../models/store');
const { geocodeAddress, reverseGeocode, NOMINATIM_CONFIG } = require('./nominatimService');

class StoreEnrichmentService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.lastNoStoresLog = 0;  // Timestamp of last "no stores" log
        this.NO_STORES_LOG_INTERVAL = 60000;  // Log "no stores" message only once per minute
    }

    /**
     * Start the background enrichment service
     */
    start() {
        if (this.isRunning) {
            console.log('[Enrichment] Service already running');
            return;
        }

        this.isRunning = true;
        console.log('[Enrichment] Service started, processing every 1.5s');

        // Run immediately, then every 1.5 seconds
        this.processNextStore();
        this.intervalId = setInterval(() => {
            this.processNextStore();
        }, NOMINATIM_CONFIG.REQUEST_INTERVAL);
    }

    /**
     * Stop the background enrichment service
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('[Enrichment] Service stopped');
    }

    /**
     * Find and process the next store that needs enrichment
     */
    async processNextStore() {
        try {
            const store = await this.findStoreNeedingEnrichment();

            if (!store) {
                // Log only once per minute to avoid spam
                const now = Date.now();
                if (now - this.lastNoStoresLog > this.NO_STORES_LOG_INTERVAL) {
                    console.log('[Enrichment] No stores need enrichment, waiting...');
                    this.lastNoStoresLog = now;
                }
                return;
            }

            await this.enrichStore(store);

        } catch (error) {
            console.error('[Enrichment] Error processing store:', error);
        }
    }

    /**
     * Find one store that needs enrichment
     * Priority order:
     * 1. Has coordinates but no address (reverse geocode)
     * 2. Has address but no coordinates (geocode)
     * 3. Has incomplete address (address completion)
     *
     * @returns {Promise<Store|null>} - Store object or null if none found
     */
    async findStoreNeedingEnrichment() {
        // Priority 1: Has coords, missing address (completely empty address)
        let store = await Store.findOne({
            where: {
                enrichment_status: 'unchanged',
                latitude: { [Op.ne]: null },
                longitude: { [Op.ne]: null },
                [Op.or]: [
                    { address: 'unknown' },
                    { address: null },
                    {
                        [Op.and]: [
                            { addr_city: null },
                            { addr_street: null },
                            { addr_housenumber: null }
                        ]
                    }
                ]
            },
            limit: 1
        });

        if (store) return store;

        // Priority 2: Has address, missing coords
        store = await Store.findOne({
            where: {
                enrichment_status: 'unchanged',
                [Op.or]: [
                    { latitude: null },
                    { longitude: null }
                ],
                address: { [Op.ne]: 'unknown' },
                [Op.or]: [
                    { addr_street: { [Op.ne]: null } },
                    { addr_city: { [Op.ne]: null } }
                ]
            },
            limit: 1
        });

        if (store) return store;

        // Priority 3: Has incomplete address
        store = await Store.findOne({
            where: {
                enrichment_status: 'unchanged',
                latitude: { [Op.ne]: null },
                longitude: { [Op.ne]: null },
                [Op.or]: [
                    { addr_city: null },
                    { addr_street: null },
                    { addr_housenumber: null },
                    { addr_postcode: null },
                    { addr_state: null },
                    { addr_country: null }
                ]
            },
            limit: 1
        });

        return store;
    }

    /**
     * Determine enrichment type and execute appropriate action
     *
     * @param {Store} store - Store object to enrich
     */
    async enrichStore(store) {
        console.log(`[Enrichment] Processing store ${store.id} (${store.name})`);

        const hasCoords = store.latitude && store.longitude;
        const hasAddress = this.hasAnyAddress(store);
        const isIncomplete = this.isAddressIncomplete(store);

        try {
            // Case 1: Has coordinates, needs address (reverse geocoding)
            if (hasCoords && !hasAddress) {
                await this.reverseGeocodeStore(store);
            }
            // Case 2: Has address, needs coordinates (geocoding)
            else if (hasAddress && !hasCoords) {
                await this.geocodeStore(store);
            }
            // Case 3: Has incomplete address (address completion via reverse geocoding)
            else if (hasCoords && isIncomplete) {
                await this.completeAddress(store);
            }
            else {
                // Should not reach here, but mark as failed if we do
                console.warn(`[Enrichment] Store ${store.id} doesn't match any enrichment criteria`);
                await this.markAsFailed(store);
            }

        } catch (error) {
            console.error(`[Enrichment] ✗ Store ${store.id} failed: ${error.message}`);
            await this.markAsFailed(store);
        }
    }

    /**
     * Geocode store (address → coordinates)
     */
    async geocodeStore(store) {
        console.log(`[Enrichment] Geocoding address for store ${store.id}`);

        const result = await geocodeAddress(store);

        if (!result) {
            console.warn(`[Enrichment] ✗ Geocoding failed for store ${store.id}`);
            await this.markAsFailed(store);
            return;
        }

        await store.update({
            latitude: result.latitude,
            longitude: result.longitude,
            enrichment_status: 'geocoded',
            enrichment_attempted_at: new Date()
        });

        console.log(`[Enrichment] ✓ Store ${store.id} enriched (geocoded)`);
    }

    /**
     * Reverse geocode store (coordinates → address)
     */
    async reverseGeocodeStore(store) {
        console.log(`[Enrichment] Reverse geocoding coords for store ${store.id}`);

        const result = await reverseGeocode(store.latitude, store.longitude);

        if (!result) {
            console.warn(`[Enrichment] ✗ Reverse geocoding failed for store ${store.id}`);
            await this.markAsFailed(store);
            return;
        }

        // Log what we're about to update for debugging
        console.log(`[Enrichment] Updating store ${store.id} with:`, {
            addr_street: result.addr_street,
            addr_city: result.addr_city,
            addr_state: result.addr_state,
            addr_country: result.addr_country
        });

        await store.update({
            address: result.address,
            addr_housenumber: result.addr_housenumber,
            addr_street: result.addr_street,
            addr_city: result.addr_city,
            addr_state: result.addr_state,
            addr_postcode: result.addr_postcode,
            addr_country: result.addr_country,
            enrichment_status: 'reverse_geocoded',
            enrichment_attempted_at: new Date()
        });

        console.log(`[Enrichment] ✓ Store ${store.id} enriched (reverse_geocoded)`);
    }

    /**
     * Complete incomplete address fields (using reverse geocoding)
     */
    async completeAddress(store) {
        console.log(`[Enrichment] Completing address for store ${store.id}`);

        const result = await reverseGeocode(store.latitude, store.longitude);

        if (!result) {
            console.warn(`[Enrichment] ✗ Address completion failed for store ${store.id}`);
            await this.markAsFailed(store);
            return;
        }

        // Only update fields that are currently missing
        const updates = {
            enrichment_status: 'address_completed',
            enrichment_attempted_at: new Date()
        };

        if (!store.addr_housenumber && result.addr_housenumber) {
            updates.addr_housenumber = result.addr_housenumber;
        }
        if (!store.addr_street && result.addr_street) {
            updates.addr_street = result.addr_street;
        }
        if (!store.addr_city && result.addr_city) {
            updates.addr_city = result.addr_city;
        }
        if (!store.addr_state && result.addr_state) {
            updates.addr_state = result.addr_state;
        }
        if (!store.addr_postcode && result.addr_postcode) {
            updates.addr_postcode = result.addr_postcode;
        }
        if (!store.addr_country && result.addr_country) {
            updates.addr_country = result.addr_country;
        }

        // Update main address if it's 'unknown' or null
        if (!store.address || store.address === 'unknown') {
            updates.address = result.address;
        }

        await store.update(updates);

        console.log(`[Enrichment] ✓ Store ${store.id} enriched (address_completed)`);
    }

    /**
     * Mark store as failed (enrichment attempted but unsuccessful)
     */
    async markAsFailed(store) {
        await store.update({
            enrichment_status: 'failed',
            enrichment_attempted_at: new Date()
        });
    }

    /**
     * Check if store has any address information
     * @param {Store} store - Store object
     * @returns {boolean}
     */
    hasAnyAddress(store) {
        return !!(
            (store.address && store.address !== 'unknown') ||
            store.addr_street ||
            store.addr_city ||
            store.addr_housenumber
        );
    }

    /**
     * Check if address is incomplete (ANY field missing)
     * @param {Store} store - Store object
     * @returns {boolean}
     */
    isAddressIncomplete(store) {
        const requiredFields = [
            'addr_housenumber',
            'addr_street',
            'addr_city',
            'addr_state',
            'addr_postcode',
            'addr_country'
        ];

        return requiredFields.some(field => !store[field]);
    }
}

// Export singleton instance
module.exports = new StoreEnrichmentService();
