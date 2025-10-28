const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Route = sequelize.define('Route', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    routeType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = Route;
