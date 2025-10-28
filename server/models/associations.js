const User = require('./user');
const Business = require('./business');
const Store = require('./store');
const Route = require('./routes');
const Punchcard = require('./punchcard');
const Visit = require('./visit');
const RouteStart = require('./routeStart');
const RouteStore = require('./routeStore');
const Search = require('./search');

User.hasMany(Visit, { foreignKey: 'userId', as: 'visits' });
Visit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Store.hasMany(Visit, { foreignKey: 'storeId', as: 'visits' });
Visit.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });

User.hasMany(RouteStart, { foreignKey: 'userId', as: 'routeStarts' });
RouteStart.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Route.hasMany(RouteStart, { foreignKey: 'routeId', as: 'routeStarts' });
RouteStart.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

Route.belongsToMany(Store, {
    through: RouteStore,
    foreignKey: 'routeId',
    otherKey: 'storeId',
    as: 'stores'
});

Store.belongsToMany(Route, {
    through: RouteStore,
    foreignKey: 'storeId',
    otherKey: 'routeId',
    as: 'routes'
});

// Direct access to junction table
Route.hasMany(RouteStore, { foreignKey: 'routeId', as: 'routeStores' });
RouteStore.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

Store.hasMany(RouteStore, { foreignKey: 'storeId', as: 'routeStores' });
RouteStore.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });

module.exports = {
    User,
    Business,
    Store,
    Route,
    Punchcard,
    Visit,
    RouteStart,
    RouteStore,
    Search
};
