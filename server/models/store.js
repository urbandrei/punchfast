const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define('Store', {
    name: {
        type: DataTypes.STRING,
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


    cuisine: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});


module.exports = Store;