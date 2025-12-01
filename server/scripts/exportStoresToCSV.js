require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const sequelize = require('../config/database');
const Store = require('../models/store');

const OUTPUT_PATH = path.join(__dirname, '../../ai/store-filter/stores.csv');
const SCRIPT_PREFIX = '[ExportStores]';

// All 64 fields in logical order
const FIELDS = [
  // Core Identification (3)
  'id',
  'osm_id',
  'osm_type',

  // Required Core Fields (3)
  'name',
  'latitude',
  'longitude',

  // Classification (2)
  'amenity',
  'shop',

  // Address (9)
  'address',
  'addr_housenumber',
  'addr_street',
  'addr_city',
  'addr_state',
  'addr_postcode',
  'addr_country',
  'addr_unit',
  'addr_suite',

  // Contact Information (8)
  'phone',
  'email',
  'website',
  'contact_facebook',
  'contact_instagram',
  'contact_twitter',
  'contact_youtube',
  'website_menu',

  // Business Hours & Service (2)
  'opening_hours',
  'cuisine',

  // AI Cuisine Classification Metadata (4)
  'cuisine_source',
  'cuisine_confidence',
  'cuisine_ai_error',
  'cuisine_classified_at',

  // Brand (3)
  'brand',
  'brand_wikidata',
  'operator',

  // Service (6)
  'takeaway',
  'delivery',
  'drive_through',
  'drive_in',
  'reservation',
  'smoking',

  // Seating & Facilities (10)
  'indoor_seating',
  'outdoor_seating',
  'wheelchair',
  'toilets',
  'toilets_wheelchair',
  'highchair',
  'changing_table',
  'internet_access',
  'internet_access_fee',
  'air_conditioning',

  // Dietary & Special (7)
  'diet_vegetarian',
  'diet_vegan',
  'diet_gluten_free',
  'diet_halal',
  'diet_kosher',
  'lgbtq',
  'bar',

  // Payment Methods (5)
  'payment_cash',
  'payment_credit_cards',
  'payment_debit_cards',
  'payment_contactless',
  'payment_mobile',

  // Metadata (8)
  'check_date',
  'source',
  'notes',
  'status',
  'enrichment_status',
  'enrichment_attempted_at',
  'created_at',
  'updated_at'
];

async function exportStoresToCSV() {
  try {
    // 1. Connect to database
    console.log(`${SCRIPT_PREFIX} Connecting to database...`);
    await sequelize.authenticate();
    console.log(`${SCRIPT_PREFIX} Database connection established`);

    // 2. Query all stores with all fields
    console.log(`${SCRIPT_PREFIX} Fetching all stores...`);
    const stores = await Store.findAll({
      attributes: FIELDS,
      raw: true,
      order: [['id', 'ASC']]
    });

    console.log(`${SCRIPT_PREFIX} Found ${stores.length} stores`);

    // 3. Log status breakdown
    if (stores.length > 0) {
      const statusCounts = stores.reduce((acc, store) => {
        acc[store.status] = (acc[store.status] || 0) + 1;
        return acc;
      }, {});
      console.log(`${SCRIPT_PREFIX} Status breakdown:`, statusCounts);
    }

    // 4. Convert to CSV
    console.log(`${SCRIPT_PREFIX} Converting to CSV format...`);
    const parser = new Parser({
      fields: FIELDS,
      header: true
    });
    const csv = parser.parse(stores);

    // 5. Write to file
    console.log(`${SCRIPT_PREFIX} Writing to ${OUTPUT_PATH}...`);
    fs.writeFileSync(OUTPUT_PATH, csv, 'utf8');

    const stats = fs.statSync(OUTPUT_PATH);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`${SCRIPT_PREFIX} Export complete!`);
    console.log(`${SCRIPT_PREFIX} File: ${OUTPUT_PATH}`);
    console.log(`${SCRIPT_PREFIX} Size: ${fileSizeKB} KB`);
    console.log(`${SCRIPT_PREFIX} Rows: ${stores.length} (+ 1 header row)`);

    process.exit(0);
  } catch (error) {
    console.error(`${SCRIPT_PREFIX} Error during export:`, error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Execute the export
exportStoresToCSV();
