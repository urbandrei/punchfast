'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add questions_answered to Users table
    await queryInterface.addColumn('Users', 'questions_answered', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Add rating to Stores table
    await queryInterface.addColumn('Stores', 'rating', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null
    });

    // Add shouldShowQuestionnaire to Visits table
    await queryInterface.addColumn('Visits', 'shouldShowQuestionnaire', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Create FieldQuestions table
    await queryInterface.createTable('FieldQuestions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stores',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      fieldName: {
        type: Sequelize.ENUM('cuisine', 'amenity', 'shop', 'rating'),
        allowNull: false
      },
      suggestedValue: {
        type: Sequelize.STRING,
        allowNull: true
      },
      skipped: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique index for FieldQuestions
    await queryInterface.addIndex('FieldQuestions', ['userId', 'storeId', 'fieldName'], {
      unique: true,
      name: 'field_questions_user_store_field_unique'
    });

    // Create GeneralQuestions table (for future use)
    await queryInterface.createTable('GeneralQuestions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stores',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      question: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      answer: {
        type: Sequelize.STRING,
        allowNull: true
      },
      skipped: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('GeneralQuestions');
    await queryInterface.dropTable('FieldQuestions');
    await queryInterface.removeColumn('Visits', 'shouldShowQuestionnaire');
    await queryInterface.removeColumn('Stores', 'rating');
    await queryInterface.removeColumn('Users', 'questions_answered');
  }
};
