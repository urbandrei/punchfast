const fs = require('fs');
const Store = require('./models/store');
const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');


async function dataIngestion(stores) {
    for(i=0; i<stores.length; i++) {
        name = stores[i].name;
        address = stores[i].address;
        latitude = stores[i].latitude;
        longitude = stores[i].longitude;
        const newStore = await Store.create({ name, address, latitude, longitude });
    }
}

try {
    const jsonData = fs.readFileSync('./stores.json', 'utf8');
    const data = JSON.parse(jsonData);
    stores = []
    for(var i = 0; i < data.elements.length; i++) {
        if(!data.elements[i].tags || !data.elements[i].tags.name || !data.elements[i].lat || !data.elements[i].lon) {
            continue;
        }
        if(!data.elements[i].tags["addr:housenumber"] || !data.elements[i].tags["addr:street"] || !data.elements[i].tags["addr:city"] || !data.elements[i].tags["addr:state"] || !data.elements[i].tags["addr:postcode"]) {
            store = {
                name:data.elements[i].tags.name,
                address:"unknown",
                latitude:data.elements[i].lat,
                longitude:data.elements[i].lon
            }
        } else {
            store = {
                name:data.elements[i].tags.name,
                address:data.elements[i].tags["addr:housenumber"] + " " + data.elements[i].tags["addr:street"] + ", " + data.elements[i].tags["addr:city"] + ", " + data.elements[i].tags["addr:state"] + " " + data.elements[i].tags["addr:postcode"],
                latitude:data.elements[i].lat,
                longitude:data.elements[i].lon
            }
        }
        stores.push(store);
    }
    dataIngestion(stores);
} catch (error) {
  console.error('Error reading or parsing JSON file:', error);
}