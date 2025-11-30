const { spawn } = require('child_process');
const path = require('path');

/**
 * Configuration for AI cuisine classification
 */
const CONFIG = {
    pythonPath: 'python3',
    scriptPath: path.join(__dirname, '../../ai/auto-cuisine/bow_cuisine.py'),
    modelDir: path.join(__dirname, '../../ai/auto-cuisine/models'),
    defaultTimeout: 15000, // 15 seconds (matches Python default)
    maxTimeout: 30000,      // 30 seconds max
    confidenceThreshold: 0.8 // 80% minimum confidence
};

/**
 * Validates that a URL is properly formatted
 * @param {string} url - URL to validate
 * @returns {boolean} - true if valid, false otherwise
 */
function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;

    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

/**
 * Classifies cuisine from a website URL using the AI model
 *
 * @param {string} url - The website URL to classify
 * @param {number} timeout - Timeout in milliseconds (default: 15000)
 * @returns {Promise<Object>} Classification result
 *
 * Success response:
 * {
 *   success: true,
 *   cuisine: 'italian',
 *   confidence: 0.8765,
 *   source: 'ai_autofilled'
 * }
 *
 * Failure responses:
 * {
 *   success: false,
 *   error: 'no_html' | 'too_short' | 'timeout' | 'invalid_url' | 'python_error' | 'low_confidence',
 *   source: 'ai_failed',
 *   details: 'Error message'
 * }
 */
async function classifyCuisineFromUrl(url, timeout = CONFIG.defaultTimeout) {
    // Validate URL format
    if (!isValidUrl(url)) {
        return {
            success: false,
            error: 'invalid_url',
            source: 'ai_failed',
            details: 'URL is not valid or missing protocol'
        };
    }

    // Clamp timeout to max
    const safeTimeout = Math.min(timeout, CONFIG.maxTimeout);
    const timeoutSeconds = Math.floor(safeTimeout / 1000);

    return new Promise((resolve) => {
        const args = [
            CONFIG.scriptPath,
            'predict',
            '--url', url,
            '--timeout', timeoutSeconds.toString(),
            '--model_dir', CONFIG.modelDir
        ];

        const pythonProcess = spawn(CONFIG.pythonPath, args);

        let stdoutData = '';
        let stderrData = '';
        let timedOut = false;

        // Set process timeout (add 2 seconds buffer for Python process overhead)
        const processTimeout = setTimeout(() => {
            timedOut = true;
            pythonProcess.kill('SIGTERM');

            resolve({
                success: false,
                error: 'timeout',
                source: 'ai_failed',
                details: `Process timeout after ${safeTimeout}ms`
            });
        }, safeTimeout + 2000);

        // Collect stdout
        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        // Collect stderr
        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
            clearTimeout(processTimeout);

            if (timedOut) return; // Already resolved in timeout

            // Process crashed or exited with error
            if (code !== 0) {
                console.error(`AI classification error (exit code ${code}):`, stderrData);
                return resolve({
                    success: false,
                    error: 'python_error',
                    source: 'ai_failed',
                    details: stderrData || `Python process exited with code ${code}`
                });
            }

            // Try to parse JSON output
            try {
                const result = JSON.parse(stdoutData.trim());

                // Model returned an error (e.g., no_html, too_short)
                if (result.error) {
                    return resolve({
                        success: false,
                        error: result.error,
                        source: 'ai_failed',
                        details: `Model error: ${result.error}`
                    });
                }

                // Success case - check confidence threshold
                if (result.cuisine) {
                    const confidence = result.proba || 0;

                    // Check if confidence meets threshold
                    if (confidence < CONFIG.confidenceThreshold) {
                        return resolve({
                            success: false,
                            error: 'low_confidence',
                            source: 'ai_failed',
                            details: `Confidence ${confidence.toFixed(2)} below threshold ${CONFIG.confidenceThreshold}`
                        });
                    }

                    return resolve({
                        success: true,
                        cuisine: result.cuisine,
                        confidence: confidence,
                        source: 'ai_autofilled'
                    });
                }

                // Unexpected response format
                return resolve({
                    success: false,
                    error: 'python_error',
                    source: 'ai_failed',
                    details: 'Model returned no cuisine and no error'
                });

            } catch (parseError) {
                console.error('Failed to parse AI model output:', parseError);
                console.error('Raw output:', stdoutData);
                return resolve({
                    success: false,
                    error: 'python_error',
                    source: 'ai_failed',
                    details: `JSON parse error: ${parseError.message}`
                });
            }
        });

        // Handle spawn errors (e.g., python3 not found)
        pythonProcess.on('error', (err) => {
            clearTimeout(processTimeout);
            console.error('Failed to spawn Python process:', err);
            resolve({
                success: false,
                error: 'python_error',
                source: 'ai_failed',
                details: `Spawn error: ${err.message}`
            });
        });
    });
}

/**
 * Main function to attempt AI cuisine classification for a store
 * Handles all edge cases and returns appropriate status
 *
 * @param {Object} storeData - Store data with website and cuisine fields
 * @returns {Promise<Object>} Classification metadata to merge with store
 */
async function attemptCuisineClassification(storeData) {
    const { website, cuisine, osm_id } = storeData;

    // Case 1: Cuisine already exists (from OSM or manual entry)
    if (cuisine) {
        return {
            cuisine_source: osm_id ? 'osm' : 'manual',
            cuisine_confidence: null,
            cuisine_ai_error: null,
            cuisine_classified_at: null
        };
    }

    // Case 4: No website available
    if (!website) {
        return {
            cuisine_source: 'no_website',
            cuisine_confidence: null,
            cuisine_ai_error: null,
            cuisine_classified_at: null
        };
    }

    // Case 2 or 3: Attempt AI classification
    const result = await classifyCuisineFromUrl(website);
    const timestamp = new Date();

    if (result.success) {
        // Case 2: Success
        return {
            cuisine: result.cuisine,
            cuisine_source: 'ai_autofilled',
            cuisine_confidence: result.confidence,
            cuisine_ai_error: null,
            cuisine_classified_at: timestamp
        };
    } else {
        // Case 3: Failed
        return {
            cuisine_source: 'ai_failed',
            cuisine_confidence: null,
            cuisine_ai_error: result.error,
            cuisine_classified_at: timestamp
        };
    }
}

module.exports = {
    classifyCuisineFromUrl,
    attemptCuisineClassification,
    CONFIG,
    isValidUrl
};
