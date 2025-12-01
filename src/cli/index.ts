#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { testCommand } from './commands/test';
import { scanCommand } from './commands/scan';

const HELP_TEXT = `
endpointx - Automatic API Request Generator & Test Runner

Usage:
  beptx <command> [options]

Commands:
  test [project-path]    Scan routes, generate tests, and run them
  scan [project-path]    Scan routes without running tests
  help                   Show this help message

Test Command Options:
  -u, --url <url>              API base URL (default: "http://localhost:3000")
  -f, --frameworks <list>      Frameworks to scan, comma-separated (default: "express,fastify,nextjs")
  -v, --variations <number>    Number of test variations per route (default: 10)
  --no-fuzzing                 Disable fuzzing tests
  --timeout <ms>               Request timeout in milliseconds (default: 5000)
  --sequential                 Run tests sequentially instead of parallel
  --concurrency <number>       Max concurrent requests (default: 10)
  -o, --output <formats>       Output formats, comma-separated (default: "cli,json,html")
  --output-dir <dir>           Output directory for reports (default: "./endpointx-reports")
  --verbose                    Verbose logging
  --config <path>              Path to config file

Scan Command Options:
  -f, --frameworks <list>      Frameworks to scan, comma-separated (default: "express,fastify,nextjs")
  --verbose                    Verbose logging
  --config <path>              Path to config file

Examples:
  beptx test ./src --url http://localhost:3000
  beptx scan ./src
  beptx test --variations 15 --output cli,json,html

Version: 1.0.0
`;

function showHelp() {
    console.log(HELP_TEXT);
    process.exit(0);
}

function showVersion() {
    console.log('1.0.0');
    process.exit(0);
}

// Parse command
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
}

if (args[0] === '--version' || args[0] === '-V') {
    showVersion();
}

const command = args[0];
const commandArgs = args.slice(1);

if (command === 'test') {
    try {
        const { values, positionals } = parseArgs({
            args: commandArgs,
            options: {
                url: { type: 'string', short: 'u', default: 'http://localhost:3000' },
                frameworks: { type: 'string', short: 'f', default: 'express,fastify,nextjs' },
                variations: { type: 'string', short: 'v', default: '10' },
                fuzzing: { type: 'boolean', default: true },
                timeout: { type: 'string', default: '5000' },
                sequential: { type: 'boolean', default: false },
                concurrency: { type: 'string', default: '10' },
                output: { type: 'string', short: 'o', default: 'cli,json,html' },
                'output-dir': { type: 'string', default: './endpointx-reports' },
                verbose: { type: 'boolean', default: false },
                config: { type: 'string' },
            },
            allowPositionals: true,
        });

        const projectPath = positionals[0] || '.';

        testCommand(projectPath, {
            url: values.url!,
            frameworks: values.frameworks!,
            variations: values.variations!,
            fuzzing: values.fuzzing!,
            timeout: values.timeout!,
            sequential: values.sequential!,
            concurrency: values.concurrency!,
            output: values.output!,
            outputDir: values['output-dir']!,
            verbose: values.verbose!,
            config: values.config,
        });
    } catch (error) {
        console.error('Error parsing arguments:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
} else if (command === 'scan') {
    try {
        const { values, positionals } = parseArgs({
            args: commandArgs,
            options: {
                frameworks: { type: 'string', short: 'f', default: 'express,fastify,nextjs' },
                verbose: { type: 'boolean', default: false },
                config: { type: 'string' },
            },
            allowPositionals: true,
        });

        const projectPath = positionals[0] || '.';

        scanCommand(projectPath, {
            frameworks: values.frameworks!,
            verbose: values.verbose!,
            config: values.config,
        });
    } catch (error) {
        console.error('Error parsing arguments:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
} else {
    console.error(`Unknown command: ${command}`);
    console.log('Run "beptx help" for usage information');
    process.exit(1);
}
