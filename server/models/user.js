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
    }

}, {
    hooks: {
        beforeCreate: async (user) => {
            user.username = user.username.toLowerCase().trim();
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    }
});

module.exports = User;
