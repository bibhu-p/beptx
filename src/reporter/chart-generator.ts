import { ChartConfig, ReportAnalytics } from '../types';

/**
 * Generate chart configurations for analytics
 */
export function generateCharts(
    analytics: ReportAnalytics
): ChartConfig[] {
    const charts: ChartConfig[] = [];

    // Pass/Fail pie chart
    charts.push(createPassFailPieChart(analytics));

    // Response time by route bar chart
    charts.push(createResponseTimeBarChart(analytics));

    // Test type distribution pie chart
    charts.push(createTestTypeDistributionChart(analytics));

    // Framework comparison bar chart
    charts.push(createFrameworkComparisonChart(analytics));

    return charts;
}

/**
 * Create pass/fail pie chart
 */
function createPassFailPieChart(analytics: ReportAnalytics): ChartConfig {
    const passed = analytics.overall.passRate;
    const failed = analytics.overall.failRate;

    return {
        type: 'pie',
        title: 'Test Results Distribution',
        labels: ['Passed', 'Failed'],
        datasets: [
            {
                label: 'Tests',
                data: [passed, failed],
                backgroundColor: ['#10b981', '#ef4444'],
                borderColor: ['#059669', '#dc2626'],
                borderWidth: 2,
            },
        ],
    };
}

/**
 * Create response time bar chart
 */
function createResponseTimeBarChart(analytics: ReportAnalytics): ChartConfig {
    const routeStats = Array.from(analytics.byRoute.values())
        .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
        .slice(0, 10); // Top 10 slowest routes

    return {
        type: 'bar',
        title: 'Average Response Time by Route (Top 10 Slowest)',
        labels: routeStats.map((s) => s.route),
        datasets: [
            {
                label: 'Avg Response Time (ms)',
                data: routeStats.map((s) => Math.round(s.avgResponseTime)),
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1,
            },
        ],
    };
}

/**
 * Create test type distribution chart
 */
function createTestTypeDistributionChart(analytics: ReportAnalytics): ChartConfig {
    const testTypeStats = Array.from(analytics.byTestType.values());

    return {
        type: 'doughnut',
        title: 'Test Type Distribution',
        labels: testTypeStats.map((s) => s.type),
        datasets: [
            {
                label: 'Tests',
                data: testTypeStats.map((s) => s.total),
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                    '#ec4899',
                    '#14b8a6',
                    '#f97316',
                ],
            },
        ],
    };
}

/**
 * Create framework comparison chart
 */
function createFrameworkComparisonChart(analytics: ReportAnalytics): ChartConfig {
    const frameworkStats = Array.from(analytics.byFramework.values());

    return {
        type: 'bar',
        title: 'Pass Rate by Framework',
        labels: frameworkStats.map((s) => s.framework),
        datasets: [
            {
                label: 'Pass Rate (%)',
                data: frameworkStats.map((s) => Math.round(s.passRate)),
                backgroundColor: '#10b981',
                borderColor: '#059669',
                borderWidth: 1,
            },
        ],
    };
}
