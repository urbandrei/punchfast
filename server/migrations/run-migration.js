const sequelize = require('../config/database');
const migration = require('./20251130190000-add-enrichment-status');

async function runMigration() {
    try {
        console.log('Running migration: add-enrichment-status');
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
