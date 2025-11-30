const { parseOverpassStatus, checkOverpassStatus, waitForAvailableSlot } = require('./server/logic/overpassRateLimiter');

console.log('Testing Overpass Rate Limiter...\n');

// Test 1: Parse status with available slots
console.log('=== Test 1: Parse status with available slots ===');
const statusWithSlots = `Connected as: 123.45.67.89
Current time: 2025-11-30T18:30:00Z
Rate limit: 2
2 slots available now.
Currently running queries (pid, space limit, time limit, start time):
`;

const result1 = parseOverpassStatus(statusWithSlots);
console.log('Input:', statusWithSlots.trim());
console.log('Result:', result1);
console.log('Expected: { available: true, slotsAvailable: 2, waitSeconds: 0 }');
console.log('Pass:', result1.available === true && result1.slotsAvailable === 2);
console.log('');

// Test 2: Parse status with rate limit (with "in X seconds")
console.log('=== Test 2: Parse status with rate limit ===');
const statusRateLimited = `Connected as: 123.45.67.89
Current time: 2025-11-30T18:30:00Z
Rate limit: 2
0 slots available now.
Slot available after: 2025-11-30T18:30:15Z, in 15 seconds.
Currently running queries (pid, space limit, time limit, start time):
`;

const result2 = parseOverpassStatus(statusRateLimited);
console.log('Input:', statusRateLimited.trim());
console.log('Result:', result2);
console.log('Expected: { available: false, slotsAvailable: 0, waitSeconds: 15 }');
console.log('Pass:', result2.available === false && result2.slotsAvailable === 0 && result2.waitSeconds === 15);
console.log('');

// Test 3: Parse status with 1 slot
console.log('=== Test 3: Parse status with 1 slot (singular) ===');
const statusOneSlot = `Connected as: 123.45.67.89
Current time: 2025-11-30T18:30:00Z
Rate limit: 2
1 slot available now.
Currently running queries (pid, space limit, time limit, start time):
`;

const result3 = parseOverpassStatus(statusOneSlot);
console.log('Result:', result3);
console.log('Expected: { available: true, slotsAvailable: 1, waitSeconds: 0 }');
console.log('Pass:', result3.available === true && result3.slotsAvailable === 1);
console.log('');

// Test 4: Live status check
console.log('=== Test 4: Live Overpass API status check ===');
checkOverpassStatus().then(liveStatus => {
    console.log('Live status:', liveStatus);
    console.log('');

    // Test 5: Wait for available slot
    console.log('=== Test 5: Wait for available slot ===');
    return waitForAvailableSlot();
}).then(result => {
    console.log('Wait completed successfully!');
    console.log('All tests completed!');
}).catch(error => {
    console.error('Error during live tests:', error.message);
});
