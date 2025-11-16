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
        defaultValue: 0
    }
}, {
    hooks: {
        beforeValidate: (card) => {
            if (card.customer_username)
                card.customer_username = card.customer_username.toLowerCase().trim();

            if (card.business_username)
                card.business_username = card.business_username.toLowerCase().trim();
        }
    }
});

module.exports = Punchcard;
