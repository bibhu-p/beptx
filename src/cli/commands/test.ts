import { ReqFlow } from '../../index';
import { ReqFlowConfig } from '../../types';
import { logger } from '../../utils/logger';
import { pathExists, readFile } from '../../utils/file-utils';
import * as path from 'path';

interface TestCommandOptions {
    url: string;
    frameworks: string;
    variations: string;
    fuzzing: boolean;
    timeout: string;
    sequential: boolean;
    concurrency: string;
    output: string;
    outputDir: string;
    verbose: boolean;
    config?: string;
}

/**
 * Test command handler
 */
export async function testCommand(projectPath: string, options: TestCommandOptions) {
    try {
        // Load config from file if specified
        let fileConfig: Partial<ReqFlowConfig> = {};
        if (options.config) {
            fileConfig = await loadConfig(options.config);
        }

        // Build config from CLI options
        const config: Partial<ReqFlowConfig> = {
            ...fileConfig,
            projectPath: path.resolve(projectPath),
            baseUrl: options.url,
            frameworks: options.frameworks.split(',') as any,
            testVariations: parseInt(options.variations),
            enableFuzzing: options.fuzzing,
            timeout: parseInt(options.timeout),
            parallel: !options.sequential,
            maxConcurrency: parseInt(options.concurrency),
            outputFormat: options.output.split(',') as any,
            outputDir: options.outputDir,
            verbose: options.verbose,
        };

        if (config.verbose) {
            logger.setVerbose(true);
        }

        logger.info('Starting ReqFlow test execution...\n');

        // Create ReqFlow instance and execute
        const reqflow = new ReqFlow(config);
        const report = await reqflow.execute();

        // Exit with error code if tests failed
        if (report.summary.failed > 0) {
            process.exit(1);
        }
    } catch (error) {
        logger.error('Test execution failed:');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

/**
 * Load configuration from file
 */
async function loadConfig(configPath: string): Promise<Partial<ReqFlowConfig>> {
    const resolvedPath = path.resolve(configPath);

    if (!pathExists(resolvedPath)) {
        logger.warn(`Config file not found: ${resolvedPath}`);
        return {};
    }

    try {
        // For .js config files, use dynamic import
        if (configPath.endsWith('.js')) {
            const config = await import(resolvedPath);
            return config.default || config;
        }

        // For .json config files
        if (configPath.endsWith('.json')) {
            const content = readFile(resolvedPath);
            return JSON.parse(content);
        }

        logger.warn(`Unsupported config file format: ${configPath}`);
        return {};
    } catch (error) {
        logger.error(`Failed to load config file: ${error}`);
        return {};
    }
}
