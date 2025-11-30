
/**
 * Overpass API Rate Limiting Module
 *
 * Checks the Overpass API status endpoint before queries to respect rate limits.
 * Waits intelligently when rate limited, with configurable timeouts and retries.
 */

const CONFIG = {
    STATUS_URL: 'https://overpass-api.de/api/status',
    STATUS_CHECK_TIMEOUT: 10000,     // 10 seconds for status check
    MAX_STATUS_RETRIES: 3,            // Retry status check 3 times
    MAX_WAIT_TIME_MS: 60000,          // 60 seconds max wait for rate limit
    RETRY_BACKOFF_MS: 1000,           // 1 second base backoff between retries
};

/**
 * Sleep helper function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse Overpass API status response (plain text format)
 *
 * Example response:
 * ```
 * Connected as: 123.45.67.89
 * Current time: 2025-11-30T18:30:00Z
 * Rate limit: 2
 * 2 slots available now.
 * Slot available after: 2025-11-30T18:30:15Z, in 15 seconds.
 * ```
 *
 * @param {string} statusText - Raw status text from API
 * @returns {{available: boolean, slotsAvailable: number, waitSeconds: number}}
 */
function parseOverpassStatus(statusText) {
    const lines = statusText.split('\n');

    // Extract available slots
    const slotsLine = lines.find(line => line.includes('slots available now') || line.includes('slot available now'));
    const slotsMatch = slotsLine?.match(/(\d+) slots? available now/);
    const slotsAvailable = slotsMatch ? parseInt(slotsMatch[1]) : 0;

    // Extract wait time if rate limited
    const waitLine = lines.find(line => line.includes('Slot available after'));
    let waitSeconds = 0;

    if (waitLine) {
        // Try to extract "in X seconds" format first
        const waitMatch = waitLine.match(/in (\d+) seconds?/);
        if (waitMatch) {
            waitSeconds = parseInt(waitMatch[1]);
        } else {
            // Parse ISO timestamp and calculate diff
            const timestampMatch = waitLine.match(/Slot available after: ([^,]+)/);
            if (timestampMatch) {
                const availableAt = new Date(timestampMatch[1]);
                const now = new Date();
                waitSeconds = Math.max(0, Math.ceil((availableAt - now) / 1000));
            }
        }
    }

    return {
        available: slotsAvailable > 0,
        slotsAvailable,
        waitSeconds
    };
}

/**
 * Check Overpass API status with retry logic
 *
 * @param {number} retries - Number of retries on failure (default: CONFIG.MAX_STATUS_RETRIES)
 * @returns {Promise<{available: boolean, slotsAvailable: number, waitSeconds: number}>}
 */
async function checkOverpassStatus(retries = CONFIG.MAX_STATUS_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.STATUS_CHECK_TIMEOUT);

            const response = await fetch(CONFIG.STATUS_URL, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }

            const statusText = await response.text();
            const status = parseOverpassStatus(statusText);

            console.log(`[Overpass] Status check: ${status.slotsAvailable} slots available, ` +
                       `${status.available ? 'ready' : `wait ${status.waitSeconds}s`}`);

            return status;

        } catch (error) {
            const isLastAttempt = attempt === retries;
            const errorMsg = error.name === 'AbortError' ? 'timeout' : error.message;

            console.warn(`[Overpass] Status check attempt ${attempt}/${retries} failed: ${errorMsg}`);

            if (!isLastAttempt) {
                // Exponential backoff: 1s, 2s, 4s
                const backoffTime = CONFIG.RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
                console.log(`[Overpass] Retrying in ${backoffTime}ms...`);
                await sleep(backoffTime);
            } else {
                // All retries exhausted - return optimistic status
                console.error('[Overpass] ⚠ All status check retries failed, proceeding anyway');
                return { available: true, slotsAvailable: 1, waitSeconds: 0 };
            }
        }
    }

    // Should never reach here, but TypeScript/linters need a return
    return { available: true, slotsAvailable: 1, waitSeconds: 0 };
}

/**
 * Wait for an available Overpass API slot
 *
 * Checks status and waits if rate limited. Throws error if wait time exceeds maximum.
 *
 * @param {number} maxWaitMs - Maximum time to wait in milliseconds (default: CONFIG.MAX_WAIT_TIME_MS)
 * @returns {Promise<boolean>} - Returns true if slot available, throws on timeout
 * @throws {Error} If wait time exceeds maxWaitMs or slot still unavailable after waiting
 */
async function waitForAvailableSlot(maxWaitMs = CONFIG.MAX_WAIT_TIME_MS) {
    console.log('[Overpass] Checking rate limits...');

    const status = await checkOverpassStatus();

    if (status.available) {
        console.log(`[Overpass] ✓ Rate limit OK, ${status.slotsAvailable} slots available`);
        return true;
    }

    // Rate limited - check if wait time is acceptable
    const waitMs = status.waitSeconds * 1000;

    if (waitMs > maxWaitMs) {
        const waitSec = status.waitSeconds;
        const maxSec = maxWaitMs / 1000;
        throw new Error(
            `Rate limit wait time (${waitSec}s) exceeds maximum (${maxSec}s)`
        );
    }

    console.log(`[Overpass] ⏳ Rate limited, waiting ${status.waitSeconds} seconds (max: ${maxWaitMs / 1000}s)...`);
    await sleep(waitMs);

    // Re-check status after waiting
    console.log('[Overpass] Re-checking status after wait...');
    const recheckStatus = await checkOverpassStatus();

    if (!recheckStatus.available) {
        throw new Error('Slot still not available after waiting');
    }

    console.log('[Overpass] ✓ Slot available after wait');
    return true;
}

module.exports = {
    checkOverpassStatus,
    waitForAvailableSlot,
    parseOverpassStatus,
    CONFIG
};
