const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    address: {
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
});


module.exports = Store;