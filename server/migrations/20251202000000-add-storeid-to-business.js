/**
 * Migration: Add storeId to Business model for store verification
 *
 * Adds:
 * - storeId: Foreign key to Stores table
 * - Unique constraint for one-to-one relationship
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('[Migration] Adding storeId to Businesses...');

    // Add storeId column with foreign key
    await queryInterface.addColumn('Businesses', 'storeId', {
      type: Sequelize.INTEGER,
      allowNull: true,  // nullable for existing businesses without stores
      references: {
        model: 'Stores',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'  // if store deleted, business association is removed
    });

    console.log('[Migration] Added storeId column');

    // Add unique constraint for one-to-one relationship
    await queryInterface.addIndex('Businesses', ['storeId'], {
      unique: true,
      name: 'businesses_storeid_unique',
      where: {
        storeId: { [Sequelize.Op.ne]: null }  // only enforce uniqueness for non-null values
      }
    });

    console.log('[Migration] ✓ storeId field and constraints added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('[Migration] Removing storeId from Businesses...');
    await queryInterface.removeIndex('Businesses', 'businesses_storeid_unique');
    await queryInterface.removeColumn('Businesses', 'storeId');
    console.log('[Migration] ✓ storeId field removed successfully');
  }
};
