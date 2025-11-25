import { EnhancedReport } from '../types';
import { writeFile } from '../utils/file-utils';
import { logger } from '../utils/logger';
import * as path from 'path';

/**
 * Generate Markdown report
 */
export function generateMarkdownReport(report: EnhancedReport, outputDir: string): void {
    const outputPath = path.join(outputDir, 'reqflow-report.md');
    const markdown = buildMarkdownReport(report);

    writeFile(outputPath, markdown);
    logger.success(`Markdown report saved to: ${outputPath}`);
}

/**
 * Build Markdown report content
 */
function buildMarkdownReport(report: EnhancedReport): string {
    const { summary, results, routes, metadata, analytics, filteredResults } = report;

    const resultsToUse = filteredResults || results;
    const passRate = ((summary.passed / summary.total) * 100).toFixed(1);

    let md = `# 🚀 ReqFlow Test Report\n\n`;
    md += `**Generated:** ${new Date(metadata.startTime).toLocaleString()}\n\n`;
    md += `---\n\n`;

    // Summary section
    md += `## 📊 Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Tests | ${summary.total} |\n`;
    md += `| ✅ Passed | ${summary.passed} |\n`;
    md += `| ❌ Failed | ${summary.failed} |\n`;
    md += `| Pass Rate | ${passRate}% |\n`;
    md += `| Total Time | ${summary.totalTime}ms |\n`;
    md += `| Routes Tested | ${routes.length} |\n\n`;

    // Analytics section
    if (analytics) {
        md += `## 📈 Analytics\n\n`;
        md += `### Performance Metrics\n\n`;
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Average Response Time | ${Math.round(analytics.overall.avgResponseTime)}ms |\n`;
        md += `| Median Response Time | ${Math.round(analytics.overall.medianResponseTime)}ms |\n`;
        md += `| P95 Response Time | ${Math.round(analytics.overall.p95ResponseTime)}ms |\n`;
        md += `| P99 Response Time | ${Math.round(analytics.overall.p99ResponseTime)}ms |\n`;
        md += `| Slowest Route | \`${analytics.overall.slowestRoute}\` |\n`;
        md += `| Fastest Route | \`${analytics.overall.fastestRoute}\` |\n\n`;

        // Framework statistics
        if (analytics.byFramework.size > 0) {
            md += `### Framework Statistics\n\n`;
            md += `| Framework | Total | Passed | Failed | Pass Rate | Avg Response Time |\n`;
            md += `|-----------|-------|--------|--------|-----------|-------------------|\n`;

            for (const stat of analytics.byFramework.values()) {
                md += `| ${stat.framework} | ${stat.total} | ${stat.passed} | ${stat.failed} | ${stat.passRate.toFixed(1)}% | ${Math.round(stat.avgResponseTime)}ms |\n`;
            }
            md += `\n`;
        }

        // Failure analysis
        if (analytics.failureAnalysis.mostCommonFailures.length > 0) {
            md += `### Most Common Failures\n\n`;
            md += `| Test Type | Count |\n`;
            md += `|-----------|-------|\n`;

            for (const failure of analytics.failureAnalysis.mostCommonFailures) {
                md += `| ${failure.type} | ${failure.count} |\n`;
            }
            md += `\n`;
        }
    }

    // Routes section
    md += `## 🛣️ Routes Summary\n\n`;

    for (const [_routeKey, routeSummary] of summary.byRoute) {
        const { route, total, passed, failed } = routeSummary;
        const routePassRate = ((passed / total) * 100).toFixed(0);
        const status = failed === 0 ? '✅' : '❌';

        md += `### ${status} \`${route.method} ${route.path}\`\n\n`;
        md += `- **Framework:** ${route.framework}\n`;
        md += `- **Tests:** ${passed}/${total} passed (${routePassRate}%)\n`;
        md += `- **File:** \`${route.filePath.split('/').pop()}\`\n\n`;

        if (failed > 0) {
            md += `**Failed Tests:**\n\n`;
            const failedTests = routeSummary.results.filter((r) => !r.passed);

            for (const result of failedTests.slice(0, 3)) {
                md += `- ❌ ${result.testCase.name}: ${result.failureReason || 'Unknown error'}\n`;
            }

            if (failed > 3) {
                md += `- ... and ${failed - 3} more failures\n`;
            }
            md += `\n`;
        }
    }

    // Failed tests details
    const failedTests = resultsToUse.filter((r) => !r.passed);
    if (failedTests.length > 0) {
        md += `## ❌ Failed Tests Details\n\n`;

        for (const result of failedTests.slice(0, 10)) {
            md += `### \`${result.testCase.method} ${result.testCase.route.path}\` - ${result.testCase.name}\n\n`;
            md += `- **Type:** ${result.testCase.type}\n`;
            md += `- **Status Code:** ${result.statusCode || 'N/A'}\n`;
            md += `- **Reason:** ${result.failureReason || result.error || 'Unknown'}\n\n`;

            if (result.testCase.body) {
                md += `**Request Body:**\n\`\`\`json\n${JSON.stringify(result.testCase.body, null, 2)}\n\`\`\`\n\n`;
            }
        }

        if (failedTests.length > 10) {
            md += `*... and ${failedTests.length - 10} more failures*\n\n`;
        }
    }

    // Footer
    md += `---\n\n`;
    md += `*Generated by ReqFlow v${metadata.packageVersion} | Node ${metadata.nodeVersion}*\n`;

    return md;
}
