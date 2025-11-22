const { Sequelize } = require("sequelize");
const path = require("path");

// Load DB config from environment
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST || "db",
        dialect: "postgres",
        logging: false,
    }
);

// Import all models
const User = require("./User");
const Business = require("./Business");
const Visit = require("./Visit");
const Store = require("./Store");

// Initialize models with sequelize instance
User.initModel(sequelize);
Business.initModel(sequelize);
Visit.initModel(sequelize);
Store.initModel(sequelize);

// Run associations
require("./associations")(sequelize);

module.exports = {
    sequelize,
    User,
    Business,
    Visit,
    Store,
};

