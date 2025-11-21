const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Punchcard = sequelize.define("Punchcard", {
    punchesRequired: { type: DataTypes.INTEGER, allowNull: false },
    reward: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Punchcard;
