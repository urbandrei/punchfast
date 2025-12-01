const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Business = sequelize.define('Business', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    status: {
        type: DataTypes.ENUM('pending', 'approved'),
        allowNull: false,
        defaultValue: 'pending'
    },

    goal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
    },

    storeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Stores',
            key: 'id'
        }
    }
}, {
    hooks: {
        beforeCreate: async (business) => {
            business.username = business.username.toLowerCase().trim();
            const salt = await bcrypt.genSalt(10);
            business.password = await bcrypt.hash(business.password, salt);
        }
    }
});

module.exports = Business;
