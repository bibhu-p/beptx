import { TestCase, TestResult } from '../types';
import { HttpRequestResult } from './http-client';

/**
 * Validate test result and determine pass/fail
 */
export function validateTestResult(
    testCase: TestCase,
    httpResult: HttpRequestResult
): TestResult {
    const timestamp = new Date();

    // If there was a connection error, test fails
    if (httpResult.error) {
        return {
            testCase,
            passed: false,
            statusCode: httpResult.statusCode,
            responseBody: httpResult.responseBody,
            responseHeaders: httpResult.responseHeaders,
            responseTime: httpResult.responseTime,
            error: httpResult.error,
            failureReason: `Request failed: ${httpResult.error}`,
            timestamp,
        };
    }

    const statusCode = httpResult.statusCode!;
    const passed = evaluateTestCase(testCase, statusCode);

    const result: TestResult = {
        testCase,
        passed,
        statusCode,
        responseBody: httpResult.responseBody,
        responseHeaders: httpResult.responseHeaders,
        responseTime: httpResult.responseTime,
        timestamp,
    };

    if (!passed) {
        result.failureReason = getFailureReason(testCase, statusCode);
    }

    return result;
}

/**
 * Evaluate if test case passed based on status code
 */
function evaluateTestCase(testCase: TestCase, statusCode: number): boolean {
    // Check expected status codes if specified
    if (testCase.expectedStatus) {
        const expected = Array.isArray(testCase.expectedStatus)
            ? testCase.expectedStatus
            : [testCase.expectedStatus];

        return expected.includes(statusCode);
    }

    // Default validation logic based on shouldPass
    if (testCase.shouldPass) {
        // Valid requests should return 2xx
        return statusCode >= 200 && statusCode < 300;
    } else {
        // Invalid requests should return 4xx or 5xx
        // But we're more lenient - we just don't want 200 OK for invalid data
        return statusCode !== 200;
    }
}

/**
 * Get failure reason message
 */
function getFailureReason(testCase: TestCase, statusCode: number): string {
    if (testCase.expectedStatus) {
        const expected = Array.isArray(testCase.expectedStatus)
            ? testCase.expectedStatus.join(', ')
            : testCase.expectedStatus;

        return `Expected status ${expected}, but got ${statusCode}`;
    }

    if (testCase.shouldPass) {
        return `Valid request should return 2xx, but got ${statusCode}`;
    } else {
        return `Invalid request should not return 200 OK, but got ${statusCode}`;
    }
}

/**
 * Categorize status code
 */
export function categorizeStatusCode(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'Success';
    if (statusCode >= 300 && statusCode < 400) return 'Redirect';
    if (statusCode >= 400 && statusCode < 500) return 'Client Error';
    if (statusCode >= 500) return 'Server Error';
    return 'Unknown';
}
