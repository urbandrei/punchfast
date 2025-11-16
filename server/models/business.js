const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Business = sequelize.define('Business', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        set(v) {
            this.setDataValue('username', String(v || '').trim().toLowerCase());
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    status: {
        type: DataTypes.ENUM('pending', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
    },

    goal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
    },

    rewardText: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Reward on completion',
    }
});

// hash password automatically
Business.beforeCreate(async (business) => {
    const salt = await bcrypt.genSalt(10);
    business.password = await bcrypt.hash(business.password, salt);
});

module.exports = Business;
