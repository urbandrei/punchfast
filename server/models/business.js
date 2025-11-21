const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const Business = sequelize.define(
  "Business",
  {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    tableName: "businesses",
  }
);

Business.beforeCreate(async (b) => {
  b.password = await bcrypt.hash(b.password, 10);
});

Business.beforeUpdate(async (b) => {
  if (b.changed("password")) {
    b.password = await bcrypt.hash(b.password, 10);
  }
});

module.exports = Business;
