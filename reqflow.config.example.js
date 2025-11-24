/**
 * ReqFlow Configuration File
 * 
 * This file demonstrates all available configuration options.
 * Copy this file to your project root as `reqflow.config.js` and customize as needed.
 */

module.exports = {
    // Project directory to scan (required)
    projectPath: './src',

    // API base URL (required)
    baseUrl: 'http://localhost:3000',

    // Frameworks to scan for (optional, auto-detect if not specified)
    frameworks: ['express', 'fastify', 'nextjs'],

    // File patterns to include (optional)
    include: ['**/*.{js,ts}'],

    // File patterns to exclude (optional)
    exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
    ],

    // Number of test variations per route (default: 10)
    testVariations: 10,

    // Enable fuzzing tests (default: true)
    enableFuzzing: true,

    // Request timeout in milliseconds (default: 5000)
    timeout: 5000,

    // Run tests in parallel (default: true)
    parallel: true,

    // Maximum concurrent requests (default: 10)
    maxConcurrency: 10,

    // Output formats: 'cli', 'json', 'html' (default: ['cli', 'json'])
    outputFormat: ['cli', 'json', 'html'],

    // Output directory for reports (default: './reqflow-reports')
    outputDir: './reqflow-reports',

    // Verbose logging (default: false)
    verbose: false,

    // Custom headers to include in all requests (optional)
    headers: {
        'Authorization': 'Bearer your-token-here',
        'X-Custom-Header': 'value',
    },

    // Number of retries for failed requests (default: 0)
    retryFailedRequests: 1,
};
