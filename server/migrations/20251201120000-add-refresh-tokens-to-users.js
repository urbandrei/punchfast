/**
 * Migration: Add refresh token fields to Users table
 *
 * Adds:
 * - refreshToken: TEXT field to store hashed refresh tokens
 * - refreshTokenCreatedAt: DATE field for token creation timestamp
 * - refreshTokenExpiresAt: DATE field for token expiry timestamp
 * - deviceInfo: JSON field for device fingerprinting
 * - lastLoginIp: STRING field for last login IP address
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('[Migration] Adding refresh token fields to Users...');

    await queryInterface.addColumn('Users', 'refreshToken', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'refreshTokenCreatedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'refreshTokenExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'deviceInfo', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });

    await queryInterface.addColumn('Users', 'lastLoginIp', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('[Migration] ✓ Refresh token fields added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('[Migration] Removing refresh token fields from Users...');

    await queryInterface.removeColumn('Users', 'refreshToken');
    await queryInterface.removeColumn('Users', 'refreshTokenCreatedAt');
    await queryInterface.removeColumn('Users', 'refreshTokenExpiresAt');
    await queryInterface.removeColumn('Users', 'deviceInfo');
    await queryInterface.removeColumn('Users', 'lastLoginIp');

    console.log('[Migration] ✓ Refresh token fields removed successfully');
  }
};
