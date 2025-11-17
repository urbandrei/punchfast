const fs = require('fs');
const Store = require('./models/store');
const sequelize = require('./config/database');
async function dataIngestion(stores) {
    try {
        console.log(`Starting ingestion of ${stores.length} stores...`);
        const uniqueStores = [];
        const seen = new Set();

        for (const store of stores) {
            if (!seen.has(store.name)) {
                uniqueStores.push(store);
                seen.add(store.name);
            }
        }

        console.log(`After deduplication: ${uniqueStores.length} stores.`);
        await Store.bulkCreate(uniqueStores, { ignoreDuplicates: true });

        console.log("Data ingestion completed successfully.");
    } catch (error) {
        console.error("Error during data ingestion:", error);
    }
}

async function start() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        await sequelize.sync();
        console.log("Database synced.");

        const jsonData = fs.readFileSync('./stores.json', 'utf8');
        const data = JSON.parse(jsonData);
        const stores = [];
        for (let i = 0; i < data.elements.length; i++) {
            const elem = data.elements[i];
            if (!elem.tags || !elem.tags.name || !elem.lat || !elem.lon) continue;
            let address = "unknown";
            if (
                elem.tags["addr:housenumber"] &&
                elem.tags["addr:street"] &&
                elem.tags["addr:city"] &&
                elem.tags["addr:state"] &&
                elem.tags["addr:postcode"]
            ) {
                address =
                    `${elem.tags["addr:housenumber"]} ` +
                    `${elem.tags["addr:street"]}, ` +
                    `${elem.tags["addr:city"]}, ` +
                    `${elem.tags["addr:state"]} ` +
                    `${elem.tags["addr:postcode"]}`;
            }
            stores.push({
                name: elem.tags.name,
                address,
                latitude: elem.lat,
                longitude: elem.lon,
            });
        }
        await dataIngestion(stores);
    } catch (error) {
        console.error("Error reading/parsing JSON or DB error:", error);
    }
}
start();
