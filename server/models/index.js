const sequelize = require("../config/database");

const User = require("./User");
const Business = require("./Business");
const Store = require("./Store");
const Visit = require("./Visit");

// Associations
Business.hasMany(Store, { foreignKey: "businessId" });
Store.belongsTo(Business, { foreignKey: "businessId" });

User.hasMany(Visit, { foreignKey: "userId" });
Visit.belongsTo(User, { foreignKey: "userId" });

Store.hasMany(Visit, { foreignKey: "storeId" });
Visit.belongsTo(Store, { foreignKey: "storeId" });

module.exports = {
    sequelize,
    User,
    Business,
    Store,
    Visit,
};
