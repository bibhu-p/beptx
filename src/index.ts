import { ReqFlowConfig, Route, TestCase, TestResult, Report } from './types';
import { DEFAULT_CONFIG } from './config/defaults';
import { scanRoutes } from './scanner';
import { generateTests } from './generator';
import { runTests, generateSummary } from './runner';
import { generateReports } from './reporter';
import { logger } from './utils/logger';

/**
 * Main ReqFlow class for fluent API
 */
export class ReqFlow {
    private config: ReqFlowConfig;
    private routes: Route[] = [];
    private testCases: TestCase[] = [];
    private results: TestResult[] = [];

    constructor(config: Partial<ReqFlowConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config } as ReqFlowConfig;

        if (this.config.verbose) {
            logger.setVerbose(true);
        }
    }

    /**
     * Scan routes from project
     */
    async scan(): Promise<Route[]> {
        this.routes = await scanRoutes({
            projectPath: this.config.projectPath,
            frameworks: this.config.frameworks,
            include: this.config.include,
            exclude: this.config.exclude,
            verbose: this.config.verbose,
        });

        return this.routes;
    }

    /**
     * Generate test cases
     */
    generate(): TestCase[] {
        if (this.routes.length === 0) {
            throw new Error('No routes found. Run scan() first.');
        }

        this.testCases = generateTests({
            routes: this.routes,
            testVariations: this.config.testVariations,
            enableFuzzing: this.config.enableFuzzing,
            baseUrl: this.config.baseUrl,
        });

        return this.testCases;
    }

    /**
     * Run tests
     */
    async run(): Promise<TestResult[]> {
        if (this.testCases.length === 0) {
            throw new Error('No test cases found. Run generate() first.');
        }

        this.results = await runTests({
            testCases: this.testCases,
            timeout: this.config.timeout,
            parallel: this.config.parallel,
            maxConcurrency: this.config.maxConcurrency,
            headers: this.config.headers,
            retryFailedRequests: this.config.retryFailedRequests,
            verbose: this.config.verbose,
        });

        return this.results;
    }

    /**
     * Generate reports
     */
    report(): Report {
        if (this.results.length === 0) {
            throw new Error('No results found. Run run() first.');
        }

        const summary = generateSummary(this.results);

        const report: Report = {
            config: this.config,
            summary,
            results: this.results,
            routes: this.routes,
            metadata: {
                startTime: new Date(),
                endTime: new Date(),
                duration: summary.totalTime,
                nodeVersion: process.version,
                packageVersion: '1.0.0',
            },
        };

        generateReports({
            report,
            outputFormat: this.config.outputFormat || ['cli', 'json'],
            outputDir: this.config.outputDir,
            verbose: this.config.verbose,
        });

        return report;
    }

    /**
     * Run complete flow: scan -> generate -> run -> report
     */
    async execute(): Promise<Report> {
        await this.scan();
        this.generate();
        await this.run();
        return this.report();
    }

    /**
     * Get routes
     */
    getRoutes(): Route[] {
        return this.routes;
    }

    /**
     * Get test cases
     */
    getTestCases(): TestCase[] {
        return this.testCases;
    }

    /**
     * Get results
     */
    getResults(): TestResult[] {
        return this.results;
    }
}

/**
 * Standalone function exports
 */
export { scanRoutes } from './scanner';
export { generateTests } from './generator';
export { runTests, generateSummary } from './runner';
export { generateReports } from './reporter';

/**
 * Type exports
 */
export * from './types';

/**
 * Default export
 */
export default ReqFlow;
