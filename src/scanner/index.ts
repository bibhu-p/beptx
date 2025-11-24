import { Route, ScannerOptions } from '../types';
import { getSourceFiles } from '../utils/file-utils';
import { logger } from '../utils/logger';
import { scanExpressRoutes, isExpressFile } from './express-scanner';
import { scanFastifyRoutes, isFastifyFile } from './fastify-scanner';
import { scanNextJsRoutes, isNextJsApiRoute } from './nextjs-scanner';

/**
 * Main route scanner - orchestrates framework-specific scanners
 */
export async function scanRoutes(options: ScannerOptions): Promise<Route[]> {
    const { projectPath, frameworks, exclude, verbose } = options;

    if (verbose) {
        logger.setVerbose(true);
    }

    logger.info(`Scanning routes in: ${projectPath}`);

    const allRoutes: Route[] = [];

    // Determine which frameworks to scan
    const frameworksToScan = frameworks || ['express', 'fastify', 'nextjs'];

    // Get all source files
    const sourceFiles = await getSourceFiles(projectPath, exclude);
    logger.debug(`Found ${sourceFiles.length} source files`);

    // Scan Next.js routes (file-based routing)
    if (frameworksToScan.includes('nextjs')) {
        logger.info('Scanning Next.js routes...');
        const nextRoutes = await scanNextJsRoutes(projectPath);
        allRoutes.push(...nextRoutes);
        logger.info(`Found ${nextRoutes.length} Next.js routes`);
    }

    // Scan Express and Fastify routes
    for (const filePath of sourceFiles) {
        // Skip Next.js API routes as they're handled separately
        if (isNextJsApiRoute(filePath)) {
            continue;
        }

        // Scan Express routes
        if (frameworksToScan.includes('express') && isExpressFile(filePath)) {
            logger.debug(`Scanning Express file: ${filePath}`);
            const routes = scanExpressRoutes(filePath);
            allRoutes.push(...routes);
        }

        // Scan Fastify routes
        if (frameworksToScan.includes('fastify') && isFastifyFile(filePath)) {
            logger.debug(`Scanning Fastify file: ${filePath}`);
            const routes = scanFastifyRoutes(filePath);
            allRoutes.push(...routes);
        }
    }

    // Remove duplicates (same method + path)
    const uniqueRoutes = deduplicateRoutes(allRoutes);

    logger.success(`Scan complete! Found ${uniqueRoutes.length} unique routes`);

    return uniqueRoutes;
}

/**
 * Remove duplicate routes
 */
function deduplicateRoutes(routes: Route[]): Route[] {
    const seen = new Set<string>();
    const unique: Route[] = [];

    for (const route of routes) {
        const key = `${route.method}:${route.path}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(route);
        }
    }

    return unique;
}

/**
 * Export all scanner functions
 */
export { scanExpressRoutes, scanFastifyRoutes, scanNextJsRoutes };
