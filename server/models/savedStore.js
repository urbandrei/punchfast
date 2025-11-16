const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const auth = require("../middleware/auth");

const SavedStore = sequelize.define('SavedStore', {
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
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['userId', 'storeId']
        }
    ]
});

module.exports = SavedStore;
