const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserAchievement = sequelize.define('UserAchievement', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    achievementId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unlockedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    firstShown: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // ===== Timestamps =====
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
    tableName: 'UserAchievements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['userId', 'achievementId']
        }
    ]
});

module.exports = UserAchievement;
