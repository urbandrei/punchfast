/**
 * Migration: Add isAdmin field to Users table
 *
 * Adds:
 * - isAdmin: BOOLEAN field to mark admin users
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('[Migration] Adding isAdmin field to Users...');

    await queryInterface.addColumn('Users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    console.log('[Migration] ✓ isAdmin field added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('[Migration] Removing isAdmin field from Users...');
    await queryInterface.removeColumn('Users', 'isAdmin');
    console.log('[Migration] ✓ isAdmin field removed successfully');
  }
};
