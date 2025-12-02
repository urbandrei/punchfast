const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    visits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },

    routes_started: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },

    routes_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },

    questions_answered: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },

    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },

    refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    refreshTokenCreatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    refreshTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    deviceInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
    },

    lastLoginIp: {
        type: DataTypes.STRING,
        allowNull: true,
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
    tableName: 'Users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            user.username = user.username.toLowerCase().trim();
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    }
});

module.exports = User;
