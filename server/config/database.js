const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');

const HOST = process.env.DB_HOST && process.env.DB_HOST.trim()
  ? process.env.DB_HOST.trim()
  : '127.0.0.1';

console.log('[DB CONFIG]', {
  host: HOST,
  db: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  port: process.env.DB_PORT || 5432
});

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;
