const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Search = sequelize.define('Search', {
    minLatitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    minLongitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    maxLatitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    maxLongitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    searchDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
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
    }
}, {
    tableName: 'Searches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Search;
