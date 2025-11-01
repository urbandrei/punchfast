const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Business = sequelize.define('Business', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  legalName: {
    type: DataTypes.STRING,
    allowNull: false,
    set(v) { this.setDataValue('legalName', v?.trim()); }
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
    set(v) { this.setDataValue('email', v?.trim().toLowerCase()); }
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    set(v) { this.setDataValue('phone', v?.trim()); }
  },

  address: {
    type: DataTypes.STRING,
    allowNull: false,
    set(v) { this.setDataValue('address', v?.trim()); }
  },

  // Stored in DB
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // Not stored in DB,setting this will fill passwordHash
  password: {
    type: DataTypes.VIRTUAL,
    set(value) {
      this.setDataValue('password', value);
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(value, salt);
      this.setDataValue('passwordHash', hash);
    },
    validate: { len: [6, 72] }, // bcrypt max 72 bytes
  },

  status: {
    type: DataTypes.ENUM('pending', 'approved'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'businesses',
  defaultScope: {
    attributes: { exclude: ['passwordHash'] }
  },
  indexes: [
    { unique: true, fields: ['email'] }
  ]
});

// to check a plain password
Business.prototype.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// ensures JSON never includes passwordHash
Business.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.passwordHash;
  return values;
};

module.exports = Business;
