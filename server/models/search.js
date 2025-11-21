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
    }
});

module.exports = Search;

