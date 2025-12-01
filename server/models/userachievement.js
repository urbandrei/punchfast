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
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['userId', 'achievementId']
        }
    ]
});

module.exports = UserAchievement;
