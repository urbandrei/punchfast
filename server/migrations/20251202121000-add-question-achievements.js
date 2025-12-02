'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert 3 achievements for questions answered
    await queryInterface.bulkInsert('Achievements', [
      {
        name: 'First Question',
        description: 'Answer your first question',
        type: 'questions_answered',
        condition: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Question Explorer',
        description: 'Answer 10 questions',
        type: 'questions_answered',
        condition: 10,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Question Master',
        description: 'Answer 50 questions',
        type: 'questions_answered',
        condition: 50,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the question achievements
    await queryInterface.bulkDelete('Achievements', {
      type: 'questions_answered'
    }, {});
  }
};
