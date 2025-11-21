const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Store = sequelize.define("Store", {
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING },
    latitude: { type: DataTypes.FLOAT },
    longitude: { type: DataTypes.FLOAT }
});

module.exports = Store;

