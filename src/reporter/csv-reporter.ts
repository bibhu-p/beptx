import { EnhancedReport } from '../types';
import { writeFile } from '../utils/file-utils';
import { logger } from '../utils/logger';
import * as path from 'path';

/**
 * Generate CSV report
 */
export function generateCsvReport(report: EnhancedReport, outputDir: string): void {
    const outputPath = path.join(outputDir, 'endpointx-report.csv');
    const csv = buildCsvReport(report);

    writeFile(outputPath, csv);
    logger.success(`CSV report saved to: ${outputPath}`);
}

/**
 * Build CSV report content
 */
function buildCsvReport(report: EnhancedReport): string {
    const { results, filteredResults } = report;
    const resultsToUse = filteredResults || results;

    // CSV header
    const headers = [
        'Test ID',
        'Route Method',
        'Route Path',
        'Framework',
        'Test Name',
        'Test Type',
        'Status',
        'Status Code',
        'Response Time (ms)',
        'Failure Reason',
        'Timestamp',
    ];

    let csv = headers.map(escapeCSV).join(',') + '\n';

    // CSV rows
    for (const result of resultsToUse) {
        const row = [
            result.testCase.id,
            result.testCase.route.method,
            result.testCase.route.path,
            result.testCase.route.framework,
            result.testCase.name,
            result.testCase.type,
            result.passed ? 'PASSED' : 'FAILED',
            result.statusCode?.toString() || '',
            result.responseTime?.toString() || '',
            result.failureReason || result.error || '',
            result.timestamp.toISOString(),
        ];

        csv += row.map(escapeCSV).join(',') + '\n';
    }

    return csv;
}

/**
 * Escape CSV field
 */
function escapeCSV(field: string): string {
    if (field === null || field === undefined) {
        return '';
    }

    const stringField = String(field);

    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }

    return stringField;
}
