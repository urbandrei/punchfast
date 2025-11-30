const Store = require('./server/models/store');
require('./server/config/database');

async function verifyStores() {
    try {
        const stores = await Store.findAll({
            attributes: ['id', 'name', 'cuisine', 'cuisine_source', 'cuisine_confidence', 'cuisine_ai_error'],
            order: [['id', 'DESC']],
            limit: 5
        });

        console.log('Recent stores in database:\n');
        stores.forEach(store => {
            console.log(`ID: ${store.id}`);
            console.log(`Name: ${store.name}`);
            console.log(`Cuisine: ${store.cuisine || 'null'}`);
            console.log(`Source: ${store.cuisine_source}`);
            console.log(`Confidence: ${store.cuisine_confidence || 'null'}`);
            console.log(`Error: ${store.cuisine_ai_error || 'null'}`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verifyStores();
