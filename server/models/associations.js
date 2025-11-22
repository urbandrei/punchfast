const {
    User,
    Business,
    Store,
    Route,
    Punchcard,
    Visit,
    RouteStart,
    RouteStore,
    Search,
    SavedStore
} = require('./index.js');


User.hasMany(Visit, { foreignKey: 'userId' });
Visit.belongsTo(User, { foreignKey: 'userId' });

Store.hasMany(Visit, { foreignKey: 'storeId' });
Visit.belongsTo(Store, { foreignKey: 'storeId' });

User.hasMany(RouteStart, { foreignKey: 'userId' });
RouteStart.belongsTo(User, { foreignKey: 'userId' });

Route.hasMany(RouteStart, { foreignKey: 'routeId' });
RouteStart.belongsTo(Route, { foreignKey: 'routeId' });

Route.belongsToMany(Store, { through: RouteStore, foreignKey: 'routeId', otherKey: 'storeId' });
Store.belongsToMany(Route, { through: RouteStore, foreignKey: 'storeId', otherKey: 'routeId' });

Route.hasMany(RouteStore, { foreignKey: 'routeId' });
RouteStore.belongsTo(Route, { foreignKey: 'routeId' });

Store.hasMany(RouteStore, { foreignKey: 'storeId' });
RouteStore.belongsTo(Store, { foreignKey: 'storeId' });

User.hasMany(SavedStore, { foreignKey: 'userId' });
SavedStore.belongsTo(User, { foreignKey: 'userId' });

Store.hasMany(SavedStore, { foreignKey: 'storeId' });
SavedStore.belongsTo(Store, { foreignKey: 'storeId' });

User.belongsToMany(Store, { through: SavedStore, foreignKey: 'userId', otherKey: 'storeId' });
Store.belongsToMany(User, { through: SavedStore, foreignKey: 'storeId', otherKey: 'userId' });
