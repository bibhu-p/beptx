import { GeneratorOptions, TestCase } from '../types';
import { buildTestCases } from './test-case-builder';
import { logger } from '../utils/logger';

/**
 * Generate test cases from routes
 */
export function generateTests(options: GeneratorOptions): TestCase[] {
    const { routes, testVariations = 10, baseUrl } = options;

    logger.info(`Generating test cases for ${routes.length} routes...`);

    const allTestCases: TestCase[] = [];

    for (const route of routes) {
        const testCases = buildTestCases(route, baseUrl, testVariations);
        allTestCases.push(...testCases);
        logger.debug(`Generated ${testCases.length} test cases for ${route.method} ${route.path}`);
    }

    logger.success(`Generated ${allTestCases.length} total test cases`);

    return allTestCases;
}

export { buildTestCases } from './test-case-builder';
export * from './payload-generator';
