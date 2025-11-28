import { scanRoutes } from '../../scanner';
import { logger } from '../../utils/logger';
import { pathExists, readFile } from '../../utils/file-utils';
import * as path from 'path';
import Table from 'cli-table3';

interface ScanCommandOptions {
    frameworks: string;
    verbose: boolean;
    config?: string;
}

/**
 * Scan command handler
 */
export async function scanCommand(projectPath: string, options: ScanCommandOptions) {
    try {
        const resolvedPath = path.resolve(projectPath);

        if (options.verbose) {
            logger.setVerbose(true);
        }

        logger.info('Scanning routes...\n');

        const routes = await scanRoutes({
            projectPath: resolvedPath,
            frameworks: options.frameworks.split(',') as any,
            verbose: options.verbose,
        });

        if (routes.length === 0) {
            logger.warn('No routes found!');
            return;
        }

        // Display routes in table
        const table = new Table({
            head: ['Method', 'Path', 'Framework', 'File'],
            style: { head: ['cyan'] },
        });

        for (const route of routes) {
            const fileName = route.filePath.split('/').pop() || route.filePath;
            table.push([
                route.method,
                route.path,
                route.framework,
                fileName,
            ]);
        }

        console.log(table.toString());
        console.log(`\n${'✓'} Found ${routes.length} routes\n`);

        // Show schema info if verbose
        if (options.verbose) {
            for (const route of routes) {
                if (route.bodySchema || route.querySchema) {
                    console.log(`\n${route.method} ${route.path}:`);

                    if (route.bodySchema) {
                        console.log('  Body Schema:');
                        console.log(`    ${JSON.stringify(route.bodySchema, null, 2)}`);
                    }

                    if (route.querySchema) {
                        console.log('  Query Schema:');
                        console.log(`    ${JSON.stringify(route.querySchema, null, 2)}`);
                    }

                    if (route.params && route.params.length > 0) {
                        console.log(`  Params: ${route.params.join(', ')}`);
                    }
                }
            }
        }
    } catch (error) {
        logger.error('Scan failed:');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
