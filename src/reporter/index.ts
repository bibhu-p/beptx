import { ReporterOptions } from '../types';
import { generateCliReport } from './cli-reporter';
import { generateJsonReport } from './json-reporter';
import { generateHtmlReport } from './html-reporter';
import { logger } from '../utils/logger';
import { pathExists } from '../utils/file-utils';
import * as fs from 'fs';

/**
 * Generate reports in specified formats
 */
export function generateReports(options: ReporterOptions): void {
    const { report, outputFormat, outputDir = './reqflow-reports', verbose } = options;

    if (verbose) {
        logger.setVerbose(true);
    }

    // Ensure output directory exists
    if (outputDir && !pathExists(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate reports in requested formats
    for (const format of outputFormat) {
        switch (format) {
            case 'cli':
                generateCliReport(report);
                break;
            case 'json':
                generateJsonReport(report, outputDir);
                break;
            case 'html':
                generateHtmlReport(report, outputDir);
                break;
        }
    }
}

export { generateCliReport } from './cli-reporter';
export { generateJsonReport } from './json-reporter';
export { generateHtmlReport } from './html-reporter';
