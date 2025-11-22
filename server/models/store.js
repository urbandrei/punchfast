const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Store = sequelize.define("Store", {
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    businessId: {
        type: DataTypes.INTEGER,
        references: {
            model: "Businesses",
            key: "id"
        }
    }
});

module.exports = Store;
