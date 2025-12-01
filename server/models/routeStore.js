const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RouteStore = sequelize.define('RouteStore', {
    routeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Routes',
            key: 'id'
        }
    },
    storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Stores',
            key: 'id'
        }
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Order of the store in the route (1-10)'
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
    tableName: 'RouteStores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = RouteStore;
