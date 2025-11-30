/**
 * Migration: Add enrichment tracking fields to Stores table
 *
 * Adds:
 * - enrichment_status: ENUM field to track enrichment state
 * - enrichment_attempted_at: Timestamp of last enrichment attempt
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('[Migration] Adding enrichment tracking fields to Stores...');

    // Create ENUM type for enrichment_status
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_Stores_enrichment_status AS ENUM(
          'unchanged',
          'geocoded',
          'reverse_geocoded',
          'address_completed',
          'failed'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('[Migration] Created ENUM type: enum_Stores_enrichment_status');

    // Add enrichment_status column
    await queryInterface.addColumn('Stores', 'enrichment_status', {
      type: Sequelize.ENUM('unchanged', 'geocoded', 'reverse_geocoded', 'address_completed', 'failed'),
      allowNull: false,
      defaultValue: 'unchanged'
    });

    console.log('[Migration] Added column: enrichment_status');

    // Add enrichment_attempted_at timestamp
    await queryInterface.addColumn('Stores', 'enrichment_attempted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    console.log('[Migration] Added column: enrichment_attempted_at');
    console.log('[Migration] ✓ Enrichment tracking fields added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('[Migration] Removing enrichment tracking fields from Stores...');

    // Remove columns
    await queryInterface.removeColumn('Stores', 'enrichment_status');
    await queryInterface.removeColumn('Stores', 'enrichment_attempted_at');

    console.log('[Migration] Removed columns');

    // Drop ENUM type
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_Stores_enrichment_status;`);

    console.log('[Migration] ✓ Enrichment tracking fields removed successfully');
  }
};
