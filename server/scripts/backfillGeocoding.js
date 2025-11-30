/**
 * Backfill Geocoding Script
 *
 * Resets enrichment_status for existing stores that have null state/country values.
 * This allows the background enrichment service to re-process them with the new
 * name-to-code conversion logic.
 *
 * Strategy: Passive approach
 * - Finds stores with coords but null state/country
 * - Resets their enrichment_status to 'unchanged'
 * - Background service will automatically re-enrich them over time
 * - Respects existing rate limiting (1.5s per store)
 *
 * Usage: node server/scripts/backfillGeocoding.js
 */

const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Store = require('../models/store');

async function backfillGeocoding() {
    try {
        console.log('[Backfill] Starting geocoding backfill...\n');

        // Connect to database
        await sequelize.authenticate();
        console.log('[Backfill] ✓ Database connected\n');

        // Find stores that were previously enriched but have null state/country
        // These are stores that were processed before the conversion logic was added
        const stores = await Store.findAll({
            where: {
                latitude: { [Op.ne]: null },
                longitude: { [Op.ne]: null },
                enrichment_status: {
                    [Op.in]: ['reverse_geocoded', 'address_completed', 'geocoded']
                },
                [Op.or]: [
                    { addr_state: null },
                    { addr_country: null }
                ]
            }
        });

        if (stores.length === 0) {
            console.log('[Backfill] ℹ No stores need backfilling');
            console.log('[Backfill] All stores already have state/country codes or are pending enrichment\n');
            process.exit(0);
        }

        console.log(`[Backfill] Found ${stores.length} stores to backfill:\n`);
        console.log(`  Stores with coordinates but null state/country codes`);
        console.log(`  These will be re-enriched with the new conversion logic\n`);

        // Reset their enrichment_status so background service picks them up
        let updated = 0;
        for (const store of stores) {
            await store.update({
                enrichment_status: 'unchanged'
            });
            updated++;

            if (updated % 50 === 0) {
                console.log(`[Backfill] Progress: ${updated}/${stores.length} stores reset...`);
            }
        }

        console.log(`\n[Backfill] ✓ Backfill complete!`);
        console.log(`[Backfill] ${updated} stores reset to 'unchanged' status`);
        console.log(`[Backfill] Background enrichment service will re-process them at 1.5s per store`);
        console.log(`[Backfill] Estimated completion time: ~${Math.ceil(updated * 1.5 / 60)} minutes\n`);

        process.exit(0);

    } catch (error) {
        console.error('[Backfill] ✗ Error:', error.message);
        console.error('[Backfill] Stack:', error.stack);
        process.exit(1);
    }
}

// Run the backfill
backfillGeocoding();
