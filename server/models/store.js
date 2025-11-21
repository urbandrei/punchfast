const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Store = sequelize.define("Store", {
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zipcode: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    website: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    latitude: { type: DataTypes.FLOAT },
    longitude: { type: DataTypes.FLOAT }
});

module.exports = Store;
