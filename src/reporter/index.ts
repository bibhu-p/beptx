import { ReporterOptions, Report, EnhancedReport } from '../types';
import { generateCliReport } from './cli-reporter';
import { generateJsonReport } from './json-reporter';
import { generateHtmlReport } from './html-reporter';
import { generateMarkdownReport } from './markdown-reporter';
import { generateCsvReport } from './csv-reporter';
import { filterResults, sortResults } from './report-filter';
import { calculateAnalytics } from './analytics';
import { generateCharts } from './chart-generator';
import { logger } from '../utils/logger';
import { pathExists } from '../utils/file-utils';
import * as fs from 'fs';

/**
 * Generate reports in specified formats
 */
export function generateReports(options: ReporterOptions): void {
    const {
        report,
        outputFormat,
        outputDir = './endpointx-reports',
        verbose,
        filter,
        groupBy,
        sortBy,
        analytics: enableAnalytics = true,
    } = options;

    if (verbose) {
        logger.setVerbose(true);
    }

    // Ensure output directory exists
    if (outputDir && !pathExists(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create enhanced report with filtering, analytics, and charts
    const enhancedReport = createEnhancedReport(report, {
        filter,
        groupBy,
        sortBy,
        enableAnalytics,
    });

    // Generate reports in requested formats
    for (const format of outputFormat) {
        switch (format) {
            case 'cli':
                generateCliReport(enhancedReport);
                break;
            case 'json':
                generateJsonReport(enhancedReport, outputDir);
                break;
            case 'html':
                generateHtmlReport(enhancedReport, outputDir);
                break;
            case 'markdown':
                generateMarkdownReport(enhancedReport, outputDir);
                break;
            case 'csv':
                generateCsvReport(enhancedReport, outputDir);
                break;
        }
    }
}

/**
 * Create enhanced report with filtering, analytics, and charts
 */
function createEnhancedReport(
    report: Report,
    options: {
        filter?: any;
        groupBy?: any;
        sortBy?: any;
        enableAnalytics: boolean;
    }
): EnhancedReport {
    const { filter, sortBy, enableAnalytics } = options;

    // Apply filtering
    let filteredResults = filter ? filterResults(report.results, filter) : report.results;

    // Apply sorting
    if (sortBy) {
        filteredResults = sortResults(filteredResults, sortBy);
    }

    // Calculate analytics if enabled
    const analytics = enableAnalytics ? calculateAnalytics(filteredResults) : undefined;

    // Generate charts if analytics are available
    const charts = analytics ? generateCharts(analytics) : undefined;

    return {
        ...report,
        filteredResults,
        analytics,
        charts,
    };
}

export { generateCliReport } from './cli-reporter';
export { generateJsonReport } from './json-reporter';
export { generateHtmlReport } from './html-reporter';
export { generateMarkdownReport } from './markdown-reporter';
export { generateCsvReport } from './csv-reporter';
export { filterResults, groupResults, sortResults } from './report-filter';
export { calculateAnalytics } from './analytics';
export { generateCharts } from './chart-generator';
