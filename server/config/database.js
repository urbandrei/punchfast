const { Sequelize } = require('sequelize');

// Render provides DATABASE_URL, fallback to individual vars for local dev
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize(
      process.env.POSTGRES_DB,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false,
      }
    );

// Log which database configuration is being used
if (process.env.DATABASE_URL) {
    console.log('Database config: Using DATABASE_URL (remote database)');
} else {
    console.log('Database config: Using individual env vars (local database)');
}

module.exports = sequelize;
