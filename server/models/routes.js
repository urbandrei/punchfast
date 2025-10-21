const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Route = sequelize.define('Route', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    store1_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    store2_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    store3_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    store4_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    store5_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
});

module.exports = Route;
