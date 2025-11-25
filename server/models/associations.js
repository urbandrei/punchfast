const User = require('./user');
const Business = require('./business');
const Store = require('./store');
const Route = require('./routes');
const Punchcard = require('./punchcard');
const Visit = require('./visit');
const RouteStart = require('./routeStart');
const RouteStore = require('./routeStore');
const Search = require('./search');
const SavedStore = require('./savedStore');

const Achievement = require('./achievement');
const UserAchievement = require('./userachievement');

User.hasMany(Visit, { foreignKey: 'userId', as: 'userVisits' });
Visit.belongsTo(User, { foreignKey: 'userId', as: 'visitUser' });

Store.hasMany(Visit, { foreignKey: 'storeId', as: 'storeVisits' });
Visit.belongsTo(Store, { foreignKey: 'storeId', as: 'visitStore' });

User.hasMany(RouteStart, { foreignKey: 'userId', as: 'userRouteStarts' });
RouteStart.belongsTo(User, { foreignKey: 'userId', as: 'routeStartUser' });

Route.hasMany(RouteStart, { foreignKey: 'routeId', as: 'routeStarts' });
RouteStart.belongsTo(Route, { foreignKey: 'routeId', as: 'startRoute' });

Route.belongsToMany(Store, {
    through: RouteStore,
    foreignKey: 'routeId',
    otherKey: 'storeId',
    as: 'routeStoresList'
});

Store.belongsToMany(Route, {
    through: RouteStore,
    foreignKey: 'storeId',
    otherKey: 'routeId',
    as: 'storeRoutesList'
});

Route.hasMany(RouteStore, { foreignKey: 'routeId', as: 'routeStoreEntries' });
RouteStore.belongsTo(Route, { foreignKey: 'routeId', as: 'routeEntry' });

Store.hasMany(RouteStore, { foreignKey: 'storeId', as: 'routeStoreEntries' });
RouteStore.belongsTo(Store, { foreignKey: 'storeId', as: 'storeEntry' });

User.hasMany(SavedStore, { foreignKey: 'userId', as: 'savedStoreEntries' });
SavedStore.belongsTo(User, { foreignKey: 'userId', as: 'savedByUser' });

Store.hasMany(SavedStore, { foreignKey: 'storeId', as: 'savedStoreUsers' });
SavedStore.belongsTo(Store, { foreignKey: 'storeId', as: 'savedStore' });

User.hasMany(UserAchievement, { foreignKey: 'userId', as: 'earnedAchievements' });
UserAchievement.belongsTo(User, { foreignKey: 'userId', as: 'achievementUser' });

Achievement.hasMany(UserAchievement, { foreignKey: 'achievementId', as: 'achievementProgress' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievementId', as: 'achievementData' });

module.exports = {
    User,
    Business,
    Store,
    Route,
    Punchcard,
    Visit,
    RouteStart,
    RouteStore,
    Search,
    SavedStore,
    Achievement,
    UserAchievement
};
