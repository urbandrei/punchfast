'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Punchcard = sequelize.define('Punchcard', {
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
  tableName: 'Punchcards',
  
  indexes: [
    { unique: true, fields: ['business_username', 'customer_username'] }
  ]
});

module.exports = Punchcard;
