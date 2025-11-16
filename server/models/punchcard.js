const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Punchcard = sequelize.define('Punchcard', {
    customer_username: {
        type: DataTypes.STRING,
        allowNull: false,
        set(v) {
            this.setDataValue('customer_username', String(v || '').trim().toLowerCase());
        }
    },
    business_username: {
        type: DataTypes.STRING,
        allowNull: false,
        set(v) {
            this.setDataValue('business_username', String(v || '').trim().toLowerCase());
        }
    },
    punches: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['business_username', 'customer_username']
        }
    ]
});

module.exports = Punchcard;
