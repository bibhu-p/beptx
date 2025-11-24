import { ReqFlowConfig } from '../types';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<ReqFlowConfig> = {
    testVariations: 10,
    enableFuzzing: true,
    timeout: 5000,
    parallel: true,
    maxConcurrency: 10,
    outputFormat: ['cli', 'json'],
    outputDir: './reqflow-reports',
    verbose: false,
    retryFailedRequests: 0,
    exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
    ],
};

/**
 * Framework detection patterns
 */
export const FRAMEWORK_PATTERNS = {
    express: [
        'app.get(',
        'app.post(',
        'app.put(',
        'app.patch(',
        'app.delete(',
        'router.get(',
        'router.post(',
        'router.put(',
        'router.patch(',
        'router.delete(',
    ],
    fastify: [
        'fastify.get(',
        'fastify.post(',
        'fastify.put(',
        'fastify.patch(',
        'fastify.delete(',
        'fastify.route(',
    ],
    nextjs: [
        'export async function GET',
        'export async function POST',
        'export async function PUT',
        'export async function PATCH',
        'export async function DELETE',
        'export default function handler',
    ],
};

/**
 * Common field name to type mappings for schema inference
 */
export const FIELD_TYPE_MAPPINGS: Record<string, string> = {
    email: 'email',
    mail: 'email',
    username: 'string',
    password: 'string',
    name: 'string',
    firstName: 'string',
    lastName: 'string',
    title: 'string',
    description: 'string',
    bio: 'string',
    age: 'number',
    count: 'number',
    price: 'number',
    amount: 'number',
    quantity: 'number',
    total: 'number',
    id: 'string',
    userId: 'string',
    productId: 'string',
    orderId: 'string',
    url: 'url',
    website: 'url',
    link: 'url',
    phone: 'string',
    mobile: 'string',
    address: 'string',
    city: 'string',
    state: 'string',
    country: 'string',
    zipCode: 'string',
    postalCode: 'string',
    date: 'date',
    createdAt: 'date',
    updatedAt: 'date',
    timestamp: 'date',
    isActive: 'boolean',
    isEnabled: 'boolean',
    isVerified: 'boolean',
    enabled: 'boolean',
    active: 'boolean',
    verified: 'boolean',
};

/**
 * Test case generation settings
 */
export const TEST_GENERATION = {
    validRequestWeight: 1,
    invalidRequestWeight: 3,
    fuzzingRequestWeight: 2,
    maxStringLength: 1000,
    minStringLength: 0,
    maxNumberValue: 1000000,
    minNumberValue: -1000000,
};
