import {
    TestResult,
    ReportAnalytics,
    FrameworkStats,
    TestTypeStats,
    RouteStats,
    TestType,
} from '../types';

/**
 * Calculate comprehensive analytics from test results
 */
export function calculateAnalytics(results: TestResult[]): ReportAnalytics {
    if (results.length === 0) {
        return createEmptyAnalytics();
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    // Calculate response time statistics
    const responseTimes = results
        .map((r) => r.responseTime)
        .filter((t): t is number => t !== undefined)
        .sort((a, b) => a - b);

    const avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length || 0;
    const medianResponseTime = calculatePercentile(responseTimes, 50);
    const p95ResponseTime = calculatePercentile(responseTimes, 95);
    const p99ResponseTime = calculatePercentile(responseTimes, 99);

    // Find slowest and fastest routes
    const routeResponseTimes = new Map<string, number[]>();
    for (const result of results) {
        const routeKey = `${result.testCase.route.method} ${result.testCase.route.path}`;
        if (!routeResponseTimes.has(routeKey)) {
            routeResponseTimes.set(routeKey, []);
        }
        if (result.responseTime !== undefined) {
            routeResponseTimes.get(routeKey)!.push(result.responseTime);
        }
    }

    let slowestRoute = '';
    let fastestRoute = '';
    let maxAvgTime = 0;
    let minAvgTime = Infinity;

    for (const [route, times] of routeResponseTimes) {
        const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
        if (avgTime > maxAvgTime) {
            maxAvgTime = avgTime;
            slowestRoute = route;
        }
        if (avgTime < minAvgTime) {
            minAvgTime = avgTime;
            fastestRoute = route;
        }
    }

    return {
        overall: {
            passRate: (passed / results.length) * 100,
            failRate: (failed / results.length) * 100,
            avgResponseTime,
            medianResponseTime,
            p95ResponseTime,
            p99ResponseTime,
            slowestRoute,
            fastestRoute,
        },
        byFramework: calculateFrameworkStats(results),
        byTestType: calculateTestTypeStats(results),
        byRoute: calculateRouteStats(results),
        failureAnalysis: analyzeFailures(results),
    };
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
}

/**
 * Calculate statistics by framework
 */
function calculateFrameworkStats(results: TestResult[]): Map<string, FrameworkStats> {
    const stats = new Map<string, FrameworkStats>();

    for (const result of results) {
        const framework = result.testCase.route.framework;

        if (!stats.has(framework)) {
            stats.set(framework, {
                framework,
                total: 0,
                passed: 0,
                failed: 0,
                passRate: 0,
                avgResponseTime: 0,
            });
        }

        const stat = stats.get(framework)!;
        stat.total++;
        if (result.passed) {
            stat.passed++;
        } else {
            stat.failed++;
        }
    }

    // Calculate pass rates and avg response times
    for (const stat of stats.values()) {
        stat.passRate = (stat.passed / stat.total) * 100;

        const frameworkResults = results.filter(
            (r) => r.testCase.route.framework === stat.framework
        );
        const responseTimes = frameworkResults
            .map((r) => r.responseTime)
            .filter((t): t is number => t !== undefined);

        stat.avgResponseTime =
            responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length || 0;
    }

    return stats;
}

/**
 * Calculate statistics by test type
 */
function calculateTestTypeStats(results: TestResult[]): Map<TestType, TestTypeStats> {
    const stats = new Map<TestType, TestTypeStats>();

    for (const result of results) {
        const type = result.testCase.type;

        if (!stats.has(type)) {
            stats.set(type, {
                type,
                total: 0,
                passed: 0,
                failed: 0,
                passRate: 0,
            });
        }

        const stat = stats.get(type)!;
        stat.total++;
        if (result.passed) {
            stat.passed++;
        } else {
            stat.failed++;
        }
    }

    // Calculate pass rates
    for (const stat of stats.values()) {
        stat.passRate = (stat.passed / stat.total) * 100;
    }

    return stats;
}

/**
 * Calculate statistics by route
 */
function calculateRouteStats(results: TestResult[]): Map<string, RouteStats> {
    const stats = new Map<string, RouteStats>();

    for (const result of results) {
        const routeKey = `${result.testCase.route.method} ${result.testCase.route.path}`;

        if (!stats.has(routeKey)) {
            stats.set(routeKey, {
                route: routeKey,
                total: 0,
                passed: 0,
                failed: 0,
                passRate: 0,
                avgResponseTime: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
            });
        }

        const stat = stats.get(routeKey)!;
        stat.total++;
        if (result.passed) {
            stat.passed++;
        } else {
            stat.failed++;
        }

        if (result.responseTime !== undefined) {
            stat.minResponseTime = Math.min(stat.minResponseTime, result.responseTime);
            stat.maxResponseTime = Math.max(stat.maxResponseTime, result.responseTime);
        }
    }

    // Calculate pass rates and avg response times
    for (const [routeKey, stat] of stats) {
        stat.passRate = (stat.passed / stat.total) * 100;

        const routeResults = results.filter(
            (r) => `${r.testCase.route.method} ${r.testCase.route.path}` === routeKey
        );
        const responseTimes = routeResults
            .map((r) => r.responseTime)
            .filter((t): t is number => t !== undefined);

        stat.avgResponseTime =
            responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length || 0;

        if (stat.minResponseTime === Infinity) {
            stat.minResponseTime = 0;
        }
    }

    return stats;
}

/**
 * Analyze failure patterns
 */
function analyzeFailures(results: TestResult[]) {
    const failedResults = results.filter((r) => !r.passed);

    // Count failures by test type
    const failuresByType = new Map<TestType, number>();
    for (const result of failedResults) {
        const type = result.testCase.type;
        failuresByType.set(type, (failuresByType.get(type) || 0) + 1);
    }

    const mostCommonFailures = Array.from(failuresByType.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Count failures by route
    const failuresByRoute = new Map<string, number>();
    for (const result of failedResults) {
        const routeKey = `${result.testCase.route.method} ${result.testCase.route.path}`;
        failuresByRoute.set(routeKey, (failuresByRoute.get(routeKey) || 0) + 1);
    }

    const routesWithMostFailures = Array.from(failuresByRoute.entries())
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        mostCommonFailures,
        routesWithMostFailures,
    };
}

/**
 * Create empty analytics object
 */
function createEmptyAnalytics(): ReportAnalytics {
    return {
        overall: {
            passRate: 0,
            failRate: 0,
            avgResponseTime: 0,
            medianResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            slowestRoute: '',
            fastestRoute: '',
        },
        byFramework: new Map(),
        byTestType: new Map(),
        byRoute: new Map(),
        failureAnalysis: {
            mostCommonFailures: [],
            routesWithMostFailures: [],
        },
    };
}
