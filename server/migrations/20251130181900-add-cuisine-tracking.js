'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add cuisine_source enum type first
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_Stores_cuisine_source AS ENUM('manual', 'osm', 'ai_autofilled', 'ai_failed', 'no_website');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add cuisine tracking fields
    await queryInterface.addColumn('Stores', 'cuisine_source', {
      type: Sequelize.ENUM('manual', 'osm', 'ai_autofilled', 'ai_failed', 'no_website'),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Stores', 'cuisine_confidence', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Stores', 'cuisine_ai_error', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Stores', 'cuisine_classified_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Stores', 'cuisine_source');
    await queryInterface.removeColumn('Stores', 'cuisine_confidence');
    await queryInterface.removeColumn('Stores', 'cuisine_ai_error');
    await queryInterface.removeColumn('Stores', 'cuisine_classified_at');

    // Drop enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_Stores_cuisine_source;
    `);
  }
};
