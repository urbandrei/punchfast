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

    // Optional search fields (OK to keep)
    cuisine: {
        type: DataTypes.STRING,
        allowNull: true
    },

    city: {
        type: DataTypes.STRING,
        allowNull: true
    }

}, 
{
    timestamps: true
});

module.exports = Route;
