'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Punchcard = sequelize.define('Punchcard', {
  // stored as lowercase for consistent lookups
  customerUsername: {
    type: DataTypes.STRING(80),
    allowNull: false,
    field: 'customer_username',
    set(v) {
      this.setDataValue('customerUsername', String(v || '').trim().toLowerCase());
    }
  },
  businessUsername: {
    type: DataTypes.STRING(80),
    allowNull: false,
    field: 'business_username',
    set(v) {
      this.setDataValue('businessUsername', String(v || '').trim().toLowerCase());
    }
  },
  punches: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: 'punchcards',
  underscored: true,
  indexes: [
    { unique: true, fields: ['business_username', 'customer_username'] } // one row per pair
  ]
});

module.exports = Punchcard;
