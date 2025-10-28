const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RouteStart = sequelize.define('RouteStart', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    routeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Routes',
            key: 'id'
        }
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

module.exports = RouteStart;
