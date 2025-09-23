const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Punchcard = sequelize.define('Punchcard', {
    customer_username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
   
    business_username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    punches: {
        type: DataTypes.INTEGER,
         allowNull: false,
    }
});



module.exports = Punchcard;