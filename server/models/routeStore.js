const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const auth = require("../middleware/auth");

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
    }
});

module.exports = RouteStore;
