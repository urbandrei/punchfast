/**
 * Migration: Add refresh token fields to Businesses table
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
    console.log('[Migration] Adding refresh token fields to Businesses...');

    await queryInterface.addColumn('Businesses', 'refreshToken', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Businesses', 'refreshTokenCreatedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Businesses', 'refreshTokenExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Businesses', 'deviceInfo', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });

    await queryInterface.addColumn('Businesses', 'lastLoginIp', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('[Migration] ✓ Refresh token fields added successfully');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('[Migration] Removing refresh token fields from Businesses...');

    await queryInterface.removeColumn('Businesses', 'refreshToken');
    await queryInterface.removeColumn('Businesses', 'refreshTokenCreatedAt');
    await queryInterface.removeColumn('Businesses', 'refreshTokenExpiresAt');
    await queryInterface.removeColumn('Businesses', 'deviceInfo');
    await queryInterface.removeColumn('Businesses', 'lastLoginIp');

    console.log('[Migration] ✓ Refresh token fields removed successfully');
  }
};
