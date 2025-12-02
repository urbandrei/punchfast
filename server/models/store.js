const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define('Store', {
    // ===== Core Identification =====
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    osm_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    osm_type: {
        type: DataTypes.ENUM('node', 'way', 'relation'),
        allowNull: true,
    },

    // ===== Required Core Fields =====
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },

    // ===== Classification =====
    amenity: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    shop: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // ===== Address (existing logic preserved) =====
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    addr_housenumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    addr_street: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    addr_city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    addr_state: {
        type: DataTypes.STRING(2),
        allowNull: true,
    },
    addr_postcode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    addr_country: {
        type: DataTypes.STRING(2),
        allowNull: true,
    },
    addr_unit: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    addr_suite: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // ===== Contact Information =====
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contact_facebook: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contact_instagram: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contact_twitter: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    contact_youtube: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    website_menu: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // ===== Business Hours & Service =====
    opening_hours: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    cuisine: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // ===== AI Cuisine Classification Metadata =====
    cuisine_source: {
        type: DataTypes.ENUM('manual', 'osm', 'ai_autofilled', 'ai_failed', 'no_website'),
        allowNull: true,
        defaultValue: null,
    },
    cuisine_confidence: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    cuisine_ai_error: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    cuisine_classified_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    rating: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },

    brand: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    brand_wikidata: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    operator: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    takeaway: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    delivery: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    drive_through: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    drive_in: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    reservation: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    smoking: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // ===== Seating & Facilities =====
    indoor_seating: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    outdoor_seating: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    wheelchair: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    toilets: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    toilets_wheelchair: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    highchair: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    changing_table: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    internet_access: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    internet_access_fee: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    air_conditioning: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // ===== Dietary & Special =====
    diet_vegetarian: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    diet_vegan: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    diet_gluten_free: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    diet_halal: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    diet_kosher: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lgbtq: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    bar: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // ===== Payment Methods =====
    payment_cash: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    payment_credit_cards: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    payment_debit_cards: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    payment_contactless: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    payment_mobile: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // ===== Metadata =====
    check_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    source: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // ===== Status & Timestamps =====
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'closed', 'pending'),
        allowNull: false,
        defaultValue: 'active',
    },

    // ===== Enrichment Tracking =====
    enrichment_status: {
        type: DataTypes.ENUM('unchanged', 'geocoded', 'reverse_geocoded', 'address_completed', 'failed'),
        allowNull: false,
        defaultValue: 'unchanged',
    },
    enrichment_attempted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },

    // ===== Timestamps =====
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'Stores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Store;
