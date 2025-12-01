import { RunnerOptions, TestResult, TestSummary, RouteTestSummary } from '../types';
import { executeRequestWithRetry } from './http-client';
import { validateTestResult } from './validator';
import { logger } from '../utils/logger';
import createSpinner from 'yocto-spinner';

/**
 * Run all test cases
 */
export async function runTests(options: RunnerOptions): Promise<TestResult[]> {
    const {
        testCases,
        timeout = 5000,
        parallel = true,
        maxConcurrency = 10,
        headers,
        retryFailedRequests = 0,
        verbose,
    } = options;

    if (verbose) {
        logger.setVerbose(true);
    }

    logger.info(`Running ${testCases.length} test cases...`);

    const spinner = createSpinner({ text: 'Executing tests...' }).start();
    const results: TestResult[] = [];

    if (parallel) {
        // Run tests in parallel with concurrency limit
        const batches = chunkArray(testCases, maxConcurrency);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            spinner.text = `Executing batch ${i + 1}/${batches.length} (${results.length}/${testCases.length} completed)`;

            const batchResults = await Promise.all(
                batch.map((testCase) =>
                    executeTest(testCase, timeout, headers, retryFailedRequests)
                )
            );

            results.push(...batchResults);
        }
    } else {
        // Run tests sequentially
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            spinner.text = `Executing test ${i + 1}/${testCases.length}`;

            const result = await executeTest(testCase, timeout, headers, retryFailedRequests);
            results.push(result);
        }
    }

    spinner.success(`Completed ${results.length} tests`);

    return results;
}

/**
 * Execute a single test
 */
async function executeTest(
    testCase: any,
    timeout: number,
    headers?: Record<string, string>,
    retries: number = 0
): Promise<TestResult> {
    const httpResult = await executeRequestWithRetry(testCase, timeout, headers, retries);
    return validateTestResult(testCase, httpResult);
}

/**
 * Generate test summary from results
 */
export function generateSummary(results: TestResult[]): TestSummary {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const totalTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0);

    // Group by route
    const byRoute = new Map<string, RouteTestSummary>();

    for (const result of results) {
        const route = result.testCase.route;
        const key = `${route.method} ${route.path}`;

        if (!byRoute.has(key)) {
            byRoute.set(key, {
                route,
                total: 0,
                passed: 0,
                failed: 0,
                results: [],
            });
        }

        const routeSummary = byRoute.get(key)!;
        routeSummary.total++;
        if (result.passed) {
            routeSummary.passed++;
        } else {
            routeSummary.failed++;
        }
        routeSummary.results.push(result);
    }

    return {
        total: results.length,
        passed,
        failed,
        skipped: 0,
        totalTime,
        byRoute,
    };
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export { executeRequestWithRetry } from './http-client';
export { validateTestResult } from './validator';
