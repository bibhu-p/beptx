import { Report } from '../types';
import { writeFile } from '../utils/file-utils';
import { logger } from '../utils/logger';
import * as path from 'path';

/**
 * Generate JSON report
 */
export function generateJsonReport(report: Report, outputDir: string): void {
    const outputPath = path.join(outputDir, 'endpointx-report.json');

    // Convert Map to object for JSON serialization
    const serializedReport = {
        ...report,
        summary: {
            ...report.summary,
            byRoute: Array.from(report.summary.byRoute.entries()).map(([key, value]) => ({
                routeKey: key,
                ...value,
            })),
        },
    };

    const json = JSON.stringify(serializedReport, null, 2);
    writeFile(outputPath, json);

    logger.success(`JSON report saved to: ${outputPath}`);
}
