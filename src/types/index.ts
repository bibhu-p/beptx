/**
 * HTTP methods supported by the scanner
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Detected route from backend code
 */
export interface Route {
    /** HTTP method */
    method: HttpMethod;
    /** Route path (e.g., /api/users/:id) */
    path: string;
    /** Framework type */
    framework: 'express' | 'fastify' | 'nextjs' | 'unknown';
    /** File where route was found */
    filePath: string;
    /** Inferred request body schema */
    bodySchema?: FieldSchema;
    /** Inferred query parameters schema */
    querySchema?: FieldSchema;
    /** Inferred URL parameters */
    params?: string[];
    /** Handler function name (if available) */
    handlerName?: string;
}

/**
 * Field schema for request validation
 */
export interface FieldSchema {
    [fieldName: string]: FieldDefinition;
}

/**
 * Field definition with type and constraints
 */
export interface FieldDefinition {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url' | 'date' | 'unknown';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    description?: string;
}

/**
 * Generated test case
 */
export interface TestCase {
    /** Unique test case ID */
    id: string;
    /** Related route */
    route: Route;
    /** Test case name/description */
    name: string;
    /** Test type */
    type: TestType;
    /** Request method */
    method: HttpMethod;
    /** Request URL */
    url: string;
    /** Request headers */
    headers?: Record<string, string>;
    /** Request body */
    body?: any;
    /** Query parameters */
    query?: Record<string, string>;
    /** Expected behavior */
    expectedStatus?: number | number[];
    /** Should this test pass or fail */
    shouldPass: boolean;
}

/**
 * Test case types
 */
export type TestType =
    | 'valid'
    | 'missing-required'
    | 'wrong-type'
    | 'empty-string'
    | 'null-value'
    | 'extra-fields'
    | 'boundary-min'
    | 'boundary-max'
    | 'sql-injection'
    | 'xss-attempt'
    | 'invalid-param'
    | 'fuzzing';

/**
 * Test execution result
 */
export interface TestResult {
    /** Test case that was executed */
    testCase: TestCase;
    /** Whether test passed */
    passed: boolean;
    /** HTTP status code received */
    statusCode?: number;
    /** Response body */
    responseBody?: any;
    /** Response headers */
    responseHeaders?: Record<string, string>;
    /** Response time in milliseconds */
    responseTime?: number;
    /** Error if request failed */
    error?: string;
    /** Failure reason if test failed */
    failureReason?: string;
    /** Timestamp */
    timestamp: Date;
}

/**
 * Test execution summary
 */
export interface TestSummary {
    /** Total tests executed */
    total: number;
    /** Passed tests */
    passed: number;
    /** Failed tests */
    failed: number;
    /** Skipped tests */
    skipped: number;
    /** Total execution time */
    totalTime: number;
    /** Results by route */
    byRoute: Map<string, RouteTestSummary>;
}

/**
 * Summary for a specific route
 */
export interface RouteTestSummary {
    route: Route;
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
}

/**
 * ReqFlow configuration
 */
export interface ReqFlowConfig {
    /** Project directory to scan */
    projectPath: string;
    /** API base URL */
    baseUrl: string;
    /** Frameworks to scan for (auto-detect if not specified) */
    frameworks?: ('express' | 'fastify' | 'nextjs')[];
    /** File patterns to include */
    include?: string[];
    /** File patterns to exclude */
    exclude?: string[];
    /** Number of test variations per route */
    testVariations?: number;
    /** Enable fuzzing */
    enableFuzzing?: boolean;
    /** Request timeout in ms */
    timeout?: number;
    /** Parallel execution */
    parallel?: boolean;
    /** Max concurrent requests */
    maxConcurrency?: number;
    /** Output format */
    outputFormat?: ('cli' | 'json' | 'html')[];
    /** Output directory for reports */
    outputDir?: string;
    /** Verbose logging */
    verbose?: boolean;
    /** Custom headers to include in all requests */
    headers?: Record<string, string>;
    /** Retry failed requests */
    retryFailedRequests?: number;
}

/**
 * Report structure
 */
export interface Report {
    /** Configuration used */
    config: ReqFlowConfig;
    /** Test summary */
    summary: TestSummary;
    /** All test results */
    results: TestResult[];
    /** Routes scanned */
    routes: Route[];
    /** Execution metadata */
    metadata: {
        startTime: Date;
        endTime: Date;
        duration: number;
        nodeVersion: string;
        packageVersion: string;
    };
}

/**
 * Scanner options
 */
export interface ScannerOptions {
    projectPath: string;
    frameworks?: ('express' | 'fastify' | 'nextjs')[];
    include?: string[];
    exclude?: string[];
    verbose?: boolean;
}

/**
 * Generator options
 */
export interface GeneratorOptions {
    routes: Route[];
    testVariations?: number;
    enableFuzzing?: boolean;
    baseUrl: string;
}

/**
 * Runner options
 */
export interface RunnerOptions {
    testCases: TestCase[];
    timeout?: number;
    parallel?: boolean;
    maxConcurrency?: number;
    headers?: Record<string, string>;
    retryFailedRequests?: number;
    verbose?: boolean;
}

/**
 * Reporter options
 */
export interface ReporterOptions {
    report: Report;
    outputFormat: ('cli' | 'json' | 'html')[];
    outputDir?: string;
    verbose?: boolean;
}
