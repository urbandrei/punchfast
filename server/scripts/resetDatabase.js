// Reset database script - drops all tables and recreates them
require('dotenv').config();
const sequelize = require('../config/database');

async function resetDatabase() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connection established.');

        console.log('Dropping all tables...');
        await sequelize.drop();
        console.log('All tables dropped successfully.');

        console.log('Recreating tables with new schema...');
        // Import models to ensure they're registered
        require('../models/associations');
        await sequelize.sync({ force: true });
        console.log('Tables recreated successfully.');

        console.log('Database reset complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase();
