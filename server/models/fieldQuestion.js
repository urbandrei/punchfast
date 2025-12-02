const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FieldQuestion = sequelize.define('FieldQuestion', {
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
    fieldName: {
        type: DataTypes.ENUM('cuisine', 'amenity', 'shop', 'rating'),
        allowNull: false
    },
    suggestedValue: {
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
    tableName: 'FieldQuestions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            // Prevent duplicate questions for same user+store+field
            unique: true,
            fields: ['userId', 'storeId', 'fieldName']
        }
    ]
});

module.exports = FieldQuestion;
