import { TestCase } from '../types';
import { logger } from '../utils/logger';

export interface HttpRequestResult {
    statusCode?: number;
    responseBody?: any;
    responseHeaders?: Record<string, string>;
    responseTime: number;
    error?: string;
}

/**
 * Execute HTTP request using native fetch
 */
export async function executeRequest(
    testCase: TestCase,
    timeout: number = 5000,
    customHeaders?: Record<string, string>
): Promise<HttpRequestResult> {
    const startTime = Date.now();

    try {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders,
            ...testCase.headers,
        };

        // Build URL with query parameters
        const url = new URL(testCase.url);
        if (testCase.query) {
            Object.entries(testCase.query).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });
        }

        logger.debug(`Executing: ${testCase.method} ${testCase.url}`);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url.toString(), {
                method: testCase.method,
                headers,
                body: testCase.body ? JSON.stringify(testCase.body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            // Parse response body
            let responseBody: any;
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                try {
                    responseBody = await response.json();
                } catch {
                    responseBody = await response.text();
                }
            } else {
                responseBody = await response.text();
            }

            // Convert headers to plain object
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            return {
                statusCode: response.status,
                responseBody,
                responseHeaders,
                responseTime,
            };
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            // Handle abort (timeout)
            if (fetchError.name === 'AbortError') {
                return {
                    responseTime,
                    error: 'Request timeout',
                };
            }

            // Handle connection errors
            if (fetchError.cause?.code === 'ECONNREFUSED') {
                return {
                    responseTime,
                    error: 'Connection refused - is the server running?',
                };
            }

            return {
                responseTime,
                error: fetchError.message || 'Network error',
            };
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            responseTime,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Execute request with retry logic
 */
export async function executeRequestWithRetry(
    testCase: TestCase,
    timeout: number,
    customHeaders?: Record<string, string>,
    maxRetries: number = 0
): Promise<HttpRequestResult> {
    let lastResult: HttpRequestResult | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
        lastResult = await executeRequest(testCase, timeout, customHeaders);

        // If request succeeded (no error), return immediately
        if (!lastResult.error) {
            return lastResult;
        }

        // If we have retries left, try again
        if (attempt < maxRetries) {
            logger.debug(`Retrying request (attempt ${attempt + 1}/${maxRetries})...`);
            await sleep(1000); // Wait 1 second before retry
            attempt++;
        } else {
            break;
        }
    }

    return lastResult!;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
