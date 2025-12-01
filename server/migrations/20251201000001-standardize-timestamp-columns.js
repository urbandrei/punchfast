/**
 * Migration: Standardize timestamp columns to snake_case
 *
 * This migration ensures all tables use created_at/updated_at (snake_case)
 * instead of createdAt/updatedAt (camelCase)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('[Migration] Standardizing timestamp columns...');

      const tables = [
        'Businesses',
        'Users',
        'Routes',
        'Visits',
        'RouteStarts',
        'RouteStores',
        'SavedStores',
        'Searches',
        'Punchcards',
        'Achievements',
        'UserAchievements'
      ];

      for (const table of tables) {
        console.log(`[Migration] Processing table: ${table}`);

        // Check if camelCase columns exist
        const tableInfo = await queryInterface.describeTable(table);

        // Handle createdAt -> created_at
        if (tableInfo.createdAt && !tableInfo.created_at) {
          console.log(`  - Renaming ${table}.createdAt to created_at`);
          await queryInterface.renameColumn(table, 'createdAt', 'created_at', { transaction });
        } else if (!tableInfo.created_at && !tableInfo.createdAt) {
          console.log(`  - Adding ${table}.created_at`);
          await queryInterface.addColumn(table, 'created_at', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          }, { transaction });
        }

        // Handle updatedAt -> updated_at
        if (tableInfo.updatedAt && !tableInfo.updated_at) {
          console.log(`  - Renaming ${table}.updatedAt to updated_at`);
          await queryInterface.renameColumn(table, 'updatedAt', 'updated_at', { transaction });
        } else if (!tableInfo.updated_at && !tableInfo.updatedAt) {
          console.log(`  - Adding ${table}.updated_at`);
          await queryInterface.addColumn(table, 'updated_at', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          }, { transaction });
        }
      }

      await transaction.commit();
      console.log('[Migration] ✓ Timestamp columns standardized successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('[Migration] ✗ Error standardizing timestamp columns:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('[Migration] Reverting timestamp column standardization...');

      const tables = [
        'Businesses',
        'Users',
        'Routes',
        'Visits',
        'RouteStarts',
        'RouteStores',
        'SavedStores',
        'Searches',
        'Punchcards',
        'Achievements',
        'UserAchievements'
      ];

      for (const table of tables) {
        const tableInfo = await queryInterface.describeTable(table);

        if (tableInfo.created_at) {
          await queryInterface.renameColumn(table, 'created_at', 'createdAt', { transaction });
        }

        if (tableInfo.updated_at) {
          await queryInterface.renameColumn(table, 'updated_at', 'updatedAt', { transaction });
        }
      }

      await transaction.commit();
      console.log('[Migration] ✓ Timestamp columns reverted successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('[Migration] ✗ Error reverting timestamp columns:', error);
      throw error;
    }
  }
};
