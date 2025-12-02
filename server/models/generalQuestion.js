const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeneralQuestion = sequelize.define('GeneralQuestion', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Stores',
            key: 'id'
        }
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    answer: {
        type: DataTypes.STRING,
        allowNull: true  // Can be null if skipped
    },
    skipped: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'GeneralQuestions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = GeneralQuestion;
