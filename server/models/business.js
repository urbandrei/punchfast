const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Business = sequelize.define(
  'Business',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    legalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Stored in DB
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Not stored in DB 
    password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        this.setDataValue('password', value);
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(String(value || ''), salt);
        this.setDataValue('passwordHash', hash);
      },
      validate: { len: [6, 72] },
    },

    status: {
      type: DataTypes.ENUM('pending', 'approved'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'businesses',
  }
);

/**
 * Safe password check that never throws.
 * Returns true/false instead of crashing the request.
 */
Business.prototype.checkPassword = async function (plain) {
  try {
    if (!plain || typeof plain !== 'string') return false;
    if (!this.passwordHash || typeof this.passwordHash !== 'string') return false;
    return await bcrypt.compare(plain, this.passwordHash);
  } catch (_) {
    return false;
  }
};

module.exports = Business;
