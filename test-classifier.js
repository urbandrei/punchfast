const { classifyCuisineFromUrl, attemptCuisineClassification } = require('./server/logic/aiCuisineClassifier');

async function testClassifier() {
    console.log('Testing AI Cuisine Classifier...\n');

    // Test 1: Valid restaurant URL
    console.log('Test 1: Testing with Chipotle URL');
    const result1 = await classifyCuisineFromUrl('https://www.chipotle.com');
    console.log('Result:', JSON.stringify(result1, null, 2));
    console.log('');

    // Test 2: Invalid URL
    console.log('Test 2: Testing with invalid URL');
    const result2 = await classifyCuisineFromUrl('not-a-url');
    console.log('Result:', JSON.stringify(result2, null, 2));
    console.log('');

    // Test 3: Store with no website
    console.log('Test 3: Testing store with no website');
    const result3 = await attemptCuisineClassification({
        name: 'Test Store',
        cuisine: null,
        website: null
    });
    console.log('Result:', JSON.stringify(result3, null, 2));
    console.log('');

    // Test 4: Store with existing cuisine
    console.log('Test 4: Testing store with existing cuisine');
    const result4 = await attemptCuisineClassification({
        name: 'Test Store',
        cuisine: 'italian',
        website: 'https://example.com',
        osm_id: null
    });
    console.log('Result:', JSON.stringify(result4, null, 2));
    console.log('');

    console.log('All tests completed!');
}

testClassifier().catch(console.error);
