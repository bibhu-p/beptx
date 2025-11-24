import axios, { AxiosError, AxiosResponse } from 'axios';
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
 * Execute HTTP request
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

        const config = {
            method: testCase.method,
            url: testCase.url,
            headers,
            timeout,
            validateStatus: () => true, // Don't throw on any status code
            params: testCase.query,
            data: testCase.body,
        };

        logger.debug(`Executing: ${testCase.method} ${testCase.url}`);

        const response: AxiosResponse = await axios(config);
        const responseTime = Date.now() - startTime;

        return {
            statusCode: response.status,
            responseBody: response.data,
            responseHeaders: response.headers as Record<string, string>,
            responseTime,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            if (axiosError.response) {
                // Server responded with error status
                return {
                    statusCode: axiosError.response.status,
                    responseBody: axiosError.response.data,
                    responseHeaders: axiosError.response.headers as Record<string, string>,
                    responseTime,
                };
            } else if (axiosError.code === 'ECONNREFUSED') {
                return {
                    responseTime,
                    error: 'Connection refused - is the server running?',
                };
            } else if (axiosError.code === 'ETIMEDOUT') {
                return {
                    responseTime,
                    error: 'Request timeout',
                };
            } else {
                return {
                    responseTime,
                    error: axiosError.message,
                };
            }
        }

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
