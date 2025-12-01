#!/usr/bin/env node

import { Command } from 'commander';
import { testCommand } from './commands/test';
import { scanCommand } from './commands/scan';

const program = new Command();

program
    .name('endpointx')
    .description('Automatic API Request Generator & Test Runner')
    .version('1.0.0');

// Test command
program
    .command('test')
    .description('Scan routes, generate tests, and run them')
    .argument('[project-path]', 'Project directory to scan', '.')
    .option('-u, --url <url>', 'API base URL', 'http://localhost:3000')
    .option('-f, --frameworks <frameworks>', 'Frameworks to scan (comma-separated)', 'express,fastify,nextjs')
    .option('-v, --variations <number>', 'Number of test variations per route', '10')
    .option('--no-fuzzing', 'Disable fuzzing tests')
    .option('--timeout <ms>', 'Request timeout in milliseconds', '5000')
    .option('--sequential', 'Run tests sequentially instead of parallel')
    .option('--concurrency <number>', 'Max concurrent requests', '10')
    .option('-o, --output <formats>', 'Output formats (comma-separated)', 'cli,json,html')
    .option('--output-dir <dir>', 'Output directory for reports', './endpointx-reports')
    .option('--verbose', 'Verbose logging')
    .option('--config <path>', 'Path to config file')
    .action(testCommand);

// Scan command
program
    .command('scan')
    .description('Scan routes without running tests')
    .argument('[project-path]', 'Project directory to scan', '.')
    .option('-f, --frameworks <frameworks>', 'Frameworks to scan (comma-separated)', 'express,fastify,nextjs')
    .option('--verbose', 'Verbose logging')
    .option('--config <path>', 'Path to config file')
    .action(scanCommand);

program.parse();
