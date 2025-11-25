import { TestResult, ReportFilter } from '../types';

/**
 * Filter test results based on criteria
 */
export function filterResults(results: TestResult[], filter?: ReportFilter): TestResult[] {
    if (!filter) {
        return results;
    }

    return results.filter((result) => {
        // Filter by route pattern
        if (filter.routePattern) {
            const regex = new RegExp(filter.routePattern);
            if (!regex.test(result.testCase.route.path)) {
                return false;
            }
        }

        // Filter by specific routes
        if (filter.routes && filter.routes.length > 0) {
            const routeKey = `${result.testCase.route.method} ${result.testCase.route.path}`;
            if (!filter.routes.includes(routeKey)) {
                return false;
            }
        }

        // Filter by status
        if (filter.status && filter.status !== 'all') {
            if (filter.status === 'passed' && !result.passed) {
                return false;
            }
            if (filter.status === 'failed' && result.passed) {
                return false;
            }
        }

        // Filter by test types
        if (filter.testTypes && filter.testTypes.length > 0) {
            if (!filter.testTypes.includes(result.testCase.type)) {
                return false;
            }
        }

        // Filter by framework
        if (filter.frameworks && filter.frameworks.length > 0) {
            if (!filter.frameworks.includes(result.testCase.route.framework as any)) {
                return false;
            }
        }

        // Filter by response time range
        if (filter.responseTimeMin !== undefined && result.responseTime !== undefined) {
            if (result.responseTime < filter.responseTimeMin) {
                return false;
            }
        }

        if (filter.responseTimeMax !== undefined && result.responseTime !== undefined) {
            if (result.responseTime > filter.responseTimeMax) {
                return false;
            }
        }

        // Filter by status codes
        if (filter.statusCodes && filter.statusCodes.length > 0) {
            if (result.statusCode === undefined || !filter.statusCodes.includes(result.statusCode)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Group results by specified criteria
 */
export function groupResults(
    results: TestResult[],
    groupBy: 'route' | 'framework' | 'status' | 'testType' | 'none'
): Map<string, TestResult[]> {
    const groups = new Map<string, TestResult[]>();

    if (groupBy === 'none') {
        groups.set('all', results);
        return groups;
    }

    for (const result of results) {
        let key: string;

        switch (groupBy) {
            case 'route':
                key = `${result.testCase.route.method} ${result.testCase.route.path}`;
                break;
            case 'framework':
                key = result.testCase.route.framework;
                break;
            case 'status':
                key = result.passed ? 'passed' : 'failed';
                break;
            case 'testType':
                key = result.testCase.type;
                break;
            default:
                key = 'unknown';
        }

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(result);
    }

    return groups;
}

/**
 * Sort results by specified criteria
 */
export function sortResults(
    results: TestResult[],
    sortBy: { field: 'name' | 'status' | 'responseTime' | 'timestamp'; order: 'asc' | 'desc' }
): TestResult[] {
    const sorted = [...results];

    sorted.sort((a, b) => {
        let comparison = 0;

        switch (sortBy.field) {
            case 'name':
                comparison = a.testCase.name.localeCompare(b.testCase.name);
                break;
            case 'status':
                comparison = (a.passed ? 1 : 0) - (b.passed ? 1 : 0);
                break;
            case 'responseTime':
                comparison = (a.responseTime || 0) - (b.responseTime || 0);
                break;
            case 'timestamp':
                comparison = a.timestamp.getTime() - b.timestamp.getTime();
                break;
        }

        return sortBy.order === 'asc' ? comparison : -comparison;
    });

    return sorted;
}
