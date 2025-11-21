const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Route = sequelize.define("Route", {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT }
});

module.exports = Route;
