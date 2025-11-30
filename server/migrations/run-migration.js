const sequelize = require('../config/database');
const migration = require('./20251130181900-add-cuisine-tracking');

async function runMigration() {
    try {
        console.log('Running migration: add-cuisine-tracking');
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
