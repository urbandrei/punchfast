const fs = require('fs');
const path = require('path');
const Store = require('./models/store');
const sequelize = require('./config/database');

async function ingestData() {
    try {
        console.log(" Connecting to database...");
        await sequelize.authenticate();
        console.log(" Connected to database.");

        const filePath = path.join(__dirname, "../stores.json");

        console.log(" Loading JSON:", filePath);
        const jsonData = fs.readFileSync(filePath, "utf8");

        const data = JSON.parse(jsonData);

        if (!data.elements || data.elements.length === 0) {
            console.log(" No store elements found in JSON file.");
            return;
        }

        let countInserted = 0;
        let countSkipped = 0;

        console.log(` Found ${data.elements.length} raw store records.`);
        console.log(" Starting ingestion...\n");

        for (const item of data.elements) {
            // Must have name + coordinates
            if (!item.tags || !item.tags.name || !item.lat || !item.lon) {
                countSkipped++;
                continue;
            }

            // Build address
            let address = "Unknown";
            if (
                item.tags["addr:housenumber"] &&
                item.tags["addr:street"] &&
                item.tags["addr:city"] &&
                item.tags["addr:state"] &&
                item.tags["addr:postcode"]
            ) {
                address =
                    `${item.tags["addr:housenumber"]} ${item.tags["addr:street"]}, ` +
                    `${item.tags["addr:city"]}, ${item.tags["addr:state"]} ` +
                    `${item.tags["addr:postcode"]}`;
            }

            const name = item.tags.name;
            const latitude = item.lat;
            const longitude = item.lon;

            // Check if store already exists
            const exists = await Store.findOne({
                where: { name, latitude, longitude }
            });

            if (exists) {
                countSkipped++;
                continue;
            }

            // Insert store
            await Store.create({
                name,
                address,
                latitude,
                longitude
            });

            countInserted++;

            if (countInserted % 50 === 0) {
                console.log(` Inserted ${countInserted} stores so far...`);
            }
        }

        console.log("\n DONE!");
        console.log(` Inserted: ${countInserted}`);
        console.log(` Skipped (duplicates/invalid): ${countSkipped}`);

    } catch (err) {
        console.error(" Error during ingestion:", err);
    } finally {
        await sequelize.close();
        console.log(" Database connection closed.");
    }
}

ingestData();

