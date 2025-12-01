import { Report, TestResult } from '../types';
import { formatTable } from '../utils/table-formatter';

/**
 * Generate CLI report
 */
export function generateCliReport(report: Report): void {
    const { summary, results } = report;

    console.log('\n' + '='.repeat(80));
    console.log('  EndpointX Test Report');
    console.log('='.repeat(80) + '\n');

    // Summary
    printSummary(summary);

    // Results by route
    console.log('\n' + 'Results by Route:' + '\n');

    for (const [routeKey, routeSummary] of summary.byRoute) {
        printRouteSummary(routeKey, routeSummary);
    }

    // Failed tests details
    const failedTests = results.filter((r) => !r.passed);
    if (failedTests.length > 0) {
        console.log('\n' + '[FAILED] Failed Tests Details:' + '\n');
        printFailedTests(failedTests);
    }

    // Recommendations
    printRecommendations(report);

    console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Print summary statistics
 */
function printSummary(summary: any): void {
    const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
    const avgTime = (summary.totalTime / summary.total).toFixed(0);

    const headers = ['Metric', 'Value'];
    const rows = [
        ['Total Tests', summary.total],
        ['[PASSED]', summary.passed],
        ['[FAILED]', summary.failed],
        ['Pass Rate', `${passRate}%`],
        ['Total Time', `${summary.totalTime}ms`],
        ['Avg Time', `${avgTime}ms`],
    ];

    console.log(formatTable(headers, rows));
}

/**
 * Print route summary
 */
function printRouteSummary(_routeKey: string, routeSummary: any): void {
    const { route, total, passed, failed } = routeSummary;
    const passRate = ((passed / total) * 100).toFixed(0);

    const statusIcon = failed === 0 ? '[PASS]' : '[FAIL]';
    const routeLabel = `${route.method} ${route.path}`;

    console.log(
        `${statusIcon} ${routeLabel} - ${passed}/${total} passed (${passRate}%)`
    );

    if (failed > 0) {
        const failedResults = routeSummary.results.filter((r: TestResult) => !r.passed);
        for (const result of failedResults.slice(0, 3)) {
            // Show first 3 failures
            console.log(
                `  → ${result.testCase.name}: ${result.failureReason}`
            );
        }
        if (failed > 3) {
            console.log(`  ... and ${failed - 3} more failures`);
        }
    }
}

/**
 * Print failed tests details
 */
function printFailedTests(failedTests: TestResult[]): void {
    for (const result of failedTests.slice(0, 10)) {
        // Show first 10 failures
        const { testCase, statusCode, failureReason, error } = result;

        console.log('-'.repeat(80));
        console.log(`${testCase.method} ${testCase.route.path}`);
        console.log(`Test: ${testCase.name}`);
        console.log(`Type: ${testCase.type}`);

        if (error) {
            console.log(`[ERROR] ${error}`);
        } else {
            console.log(`Status Code: ${statusCode}`);
            console.log(`[FAILED] Reason: ${failureReason}`);
        }

        if (testCase.body) {
            console.log('Request Body:');
            console.log(JSON.stringify(testCase.body, null, 2));
        }
    }

    if (failedTests.length > 10) {
        console.log(`\n... and ${failedTests.length - 10} more failures`);
    }
}

/**
 * Print recommendations
 */
function printRecommendations(report: Report): void {
    const { results } = report;
    const recommendations: string[] = [];

    // Check for missing validation
    const missingValidation = results.filter(
        (r) => r.testCase.type === 'missing-required' && r.statusCode === 200
    );

    if (missingValidation.length > 0) {
        recommendations.push(
            `[WARN] ${missingValidation.length} route(s) accept requests with missing required fields`
        );
    }

    // Check for wrong type acceptance
    const wrongTypeAccepted = results.filter(
        (r) => r.testCase.type === 'wrong-type' && r.statusCode === 200
    );

    if (wrongTypeAccepted.length > 0) {
        recommendations.push(
            `[WARN] ${wrongTypeAccepted.length} route(s) accept wrong data types`
        );
    }

    // Check for security issues
    const securityIssues = results.filter(
        (r) =>
            (r.testCase.type === 'sql-injection' || r.testCase.type === 'xss-attempt') &&
            r.statusCode === 200
    );

    if (securityIssues.length > 0) {
        recommendations.push(
            `[WARN] ${securityIssues.length} route(s) may be vulnerable to injection attacks`
        );
    }

    if (recommendations.length > 0) {
        console.log('\n' + 'Recommendations:' + '\n');
        recommendations.forEach((rec) => console.log(`  ${rec}`));
    } else {
        console.log('\n' + '[SUCCESS] No major issues detected!');
    }
}
