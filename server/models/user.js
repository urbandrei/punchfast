const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
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
    tableName: "users",
  }
);

User.beforeCreate(async (u) => {
  u.password = await bcrypt.hash(u.password, 10);
});

User.beforeUpdate(async (u) => {
  if (u.changed("password")) {
    u.password = await bcrypt.hash(u.password, 10);
  }
});

module.exports = User;

