const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
    // ===== Core Identification =====
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    // ===== Reported Item Reference =====
    reportedItemType: {
        type: DataTypes.ENUM('store', 'route'),
        allowNull: false,
        field: 'reported_item_type',
    },
    reportedItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'reported_item_id',
    },

    // ===== Reporter Information =====
    reporterId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow guest reports
        field: 'reporter_id',
    },

    // ===== Report Content =====
    category: {
        type: DataTypes.ENUM(
            'closed_permanently',
            'wrong_location',
            'duplicate',
            'inappropriate_content',
            'spam',
            'other'
        ),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // ===== Report Status =====
    status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
        allowNull: false,
        defaultValue: 'pending',
    },

    // ===== Admin Actions =====
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'admin_notes',
    },
    reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reviewed_by',
    },
    reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at',
    },

    // ===== Timestamps =====
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
    },
}, {
    tableName: 'Reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Report;
