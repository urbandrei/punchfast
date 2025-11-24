const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Achievement = sequelize.define('Achievement', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,    
        allowNull: false
    },
    condition: {
        type: DataTypes.INTEGER,   
        allowNull: false
    }
});

module.exports = Achievement;
