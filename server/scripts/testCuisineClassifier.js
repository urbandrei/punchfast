require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Store = require('../models/store');
const { classifyCuisineFromUrl } = require('../logic/aiCuisineClassifier');

const SCRIPT_PREFIX = '[CuisineTest]';

async function testCuisineClassifier() {
    console.log(`${SCRIPT_PREFIX} Starting cuisine classifier accuracy test...`);

    try {
        // Connect to database
        await sequelize.authenticate();
        console.log(`${SCRIPT_PREFIX} Database connected`);

        // Query stores with both website and cuisine
        const stores = await Store.findAll({
            where: {
                website: { [Op.ne]: null, [Op.ne]: '' },
                cuisine: { [Op.ne]: null, [Op.ne]: '' }
            },
            attributes: ['id', 'name', 'website', 'cuisine'],
            limit: 100
        });

        console.log(`${SCRIPT_PREFIX} Found ${stores.length} stores with website AND cuisine`);

        if (stores.length === 0) {
            console.log(`${SCRIPT_PREFIX} No stores to test. Exiting.`);
            process.exit(0);
        }

        // Track results
        let total = 0;
        let successes = 0;
        let correct = 0;
        let failures = 0;
        const errors = {};
        const mismatches = [];

        // Test each store
        for (const store of stores) {
            total++;
            console.log(`${SCRIPT_PREFIX} [${total}/${stores.length}] Testing: ${store.name}`);

            const result = await classifyCuisineFromUrl(store.website);

            if (result.success) {
                successes++;
                const predicted = result.cuisine.toLowerCase().trim();
                const actual = store.cuisine.toLowerCase().trim();

                if (predicted === actual) {
                    correct++;
                    console.log(`  -> CORRECT: predicted "${result.cuisine}" (${(result.confidence * 100).toFixed(1)}%)`);
                } else {
                    mismatches.push({
                        name: store.name,
                        actual: store.cuisine,
                        predicted: result.cuisine,
                        confidence: result.confidence
                    });
                    console.log(`  -> WRONG: predicted "${result.cuisine}" but actual is "${store.cuisine}"`);
                }
            } else {
                failures++;
                errors[result.error] = (errors[result.error] || 0) + 1;
                console.log(`  -> FAILED: ${result.error}`);
            }
        }

        // Calculate accuracy
        const accuracy = successes > 0 ? (correct / successes * 100).toFixed(2) : 0;

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log(`${SCRIPT_PREFIX} RESULTS SUMMARY`);
        console.log('='.repeat(60));
        console.log(`Total stores tested:      ${total}`);
        console.log(`Successful classifications: ${successes}`);
        console.log(`Failed classifications:   ${failures}`);
        console.log(`Correct predictions:      ${correct}`);
        console.log(`Wrong predictions:        ${successes - correct}`);
        console.log(`ACCURACY:                 ${accuracy}%`);

        if (Object.keys(errors).length > 0) {
            console.log('\nFailure breakdown:');
            for (const [error, count] of Object.entries(errors)) {
                console.log(`  ${error}: ${count}`);
            }
        }

        if (mismatches.length > 0 && mismatches.length <= 20) {
            console.log('\nMismatches:');
            for (const m of mismatches) {
                console.log(`  "${m.name}": predicted "${m.predicted}" (${(m.confidence * 100).toFixed(1)}%), actual "${m.actual}"`);
            }
        }

        console.log('='.repeat(60));

    } catch (error) {
        console.error(`${SCRIPT_PREFIX} Error:`, error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

testCuisineClassifier();
