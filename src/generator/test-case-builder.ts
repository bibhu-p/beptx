import { Route, TestCase, FieldSchema } from '../types';
import {
    generateValidValue,
    generateInvalidValue,
    generateSqlInjection,
    generateXssAttempt,
    generateFuzzValue,
} from './payload-generator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Build test cases for a route
 */
export function buildTestCases(route: Route, baseUrl: string, variations: number): TestCase[] {
    const testCases: TestCase[] = [];

    // 1. Valid request
    testCases.push(buildValidTestCase(route, baseUrl));

    // 2. Invalid variations based on schema
    if (route.bodySchema) {
        testCases.push(...buildInvalidBodyTestCases(route, baseUrl));
    }

    if (route.querySchema) {
        testCases.push(...buildInvalidQueryTestCases(route, baseUrl));
    }

    // 3. Parameter variations
    if (route.params && route.params.length > 0) {
        testCases.push(...buildInvalidParamTestCases(route, baseUrl));
    }

    // 4. Security test cases
    if (route.method === 'POST' || route.method === 'PUT' || route.method === 'PATCH') {
        testCases.push(...buildSecurityTestCases(route, baseUrl));
    }

    // 5. Fuzzing test cases (if we haven't reached variation limit)
    const remainingVariations = variations - testCases.length;
    if (remainingVariations > 0) {
        testCases.push(...buildFuzzingTestCases(route, baseUrl, remainingVariations));
    }

    return testCases.slice(0, variations);
}

/**
 * Build valid test case
 */
function buildValidTestCase(route: Route, baseUrl: string): TestCase {
    const body = route.bodySchema ? generateValidPayload(route.bodySchema) : undefined;
    const query = route.querySchema ? generateValidPayload(route.querySchema) : undefined;
    const url = buildUrl(baseUrl, route.path, route.params);

    return {
        id: uuidv4(),
        route,
        name: 'Valid request',
        type: 'valid',
        method: route.method,
        url,
        body,
        query,
        expectedStatus: [200, 201],
        shouldPass: true,
    };
}

/**
 * Build invalid body test cases
 */
function buildInvalidBodyTestCases(route: Route, baseUrl: string): TestCase[] {
    const testCases: TestCase[] = [];
    const schema = route.bodySchema!;
    const fieldNames = Object.keys(schema);

    if (fieldNames.length === 0) {
        return testCases;
    }

    // Missing required field
    const requiredFields = fieldNames.filter((name) => schema[name].required);
    if (requiredFields.length > 0) {
        const fieldToRemove = requiredFields[0];
        const body = generateValidPayload(schema);
        delete body[fieldToRemove];

        testCases.push({
            id: uuidv4(),
            route,
            name: `Missing required field: ${fieldToRemove}`,
            type: 'missing-required',
            method: route.method,
            url: buildUrl(baseUrl, route.path, route.params),
            body,
            expectedStatus: [400, 422],
            shouldPass: false,
        });
    }

    // Wrong type for first field
    const firstField = fieldNames[0];
    const wrongTypeBody = generateValidPayload(schema);
    wrongTypeBody[firstField] = generateInvalidValue(schema[firstField], 'wrong-type');

    testCases.push({
        id: uuidv4(),
        route,
        name: `Wrong type for field: ${firstField}`,
        type: 'wrong-type',
        method: route.method,
        url: buildUrl(baseUrl, route.path, route.params),
        body: wrongTypeBody,
        expectedStatus: [400, 422],
        shouldPass: false,
    });

    // Empty string
    const emptyStringBody = generateValidPayload(schema);
    emptyStringBody[firstField] = '';

    testCases.push({
        id: uuidv4(),
        route,
        name: `Empty string for field: ${firstField}`,
        type: 'empty-string',
        method: route.method,
        url: buildUrl(baseUrl, route.path, route.params),
        body: emptyStringBody,
        expectedStatus: [400, 422],
        shouldPass: false,
    });

    // Null value
    const nullBody = generateValidPayload(schema);
    nullBody[firstField] = null;

    testCases.push({
        id: uuidv4(),
        route,
        name: `Null value for field: ${firstField}`,
        type: 'null-value',
        method: route.method,
        url: buildUrl(baseUrl, route.path, route.params),
        body: nullBody,
        expectedStatus: [400, 422],
        shouldPass: false,
    });

    // Extra fields
    const extraFieldsBody = { ...generateValidPayload(schema), unexpectedField: 'should not be here' };

    testCases.push({
        id: uuidv4(),
        route,
        name: 'Extra unexpected fields',
        type: 'extra-fields',
        method: route.method,
        url: buildUrl(baseUrl, route.path, route.params),
        body: extraFieldsBody,
        expectedStatus: [200, 201, 400], // Some APIs accept extra fields
        shouldPass: true, // This is a soft test
    });

    return testCases;
}

/**
 * Build invalid query test cases
 */
function buildInvalidQueryTestCases(route: Route, baseUrl: string): TestCase[] {
    const testCases: TestCase[] = [];
    const schema = route.querySchema!;
    const fieldNames = Object.keys(schema);

    if (fieldNames.length === 0) {
        return testCases;
    }

    // Wrong type for query parameter
    const firstField = fieldNames[0];
    const query = generateValidPayload(schema);
    query[firstField] = generateInvalidValue(schema[firstField], 'wrong-type');

    testCases.push({
        id: uuidv4(),
        route,
        name: `Wrong type for query param: ${firstField}`,
        type: 'wrong-type',
        method: route.method,
        url: buildUrl(baseUrl, route.path, route.params),
        query,
        expectedStatus: [400, 422],
        shouldPass: false,
    });

    return testCases;
}

/**
 * Build invalid parameter test cases
 */
function buildInvalidParamTestCases(route: Route, baseUrl: string): TestCase[] {
    const testCases: TestCase[] = [];

    // Invalid param format
    const invalidParams = route.params!.reduce((acc, param) => {
        acc[param] = 'invalid@#$%';
        return acc;
    }, {} as Record<string, string>);

    testCases.push({
        id: uuidv4(),
        route,
        name: 'Invalid URL parameters',
        type: 'invalid-param',
        method: route.method,
        url: buildUrl(baseUrl, route.path, route.params, invalidParams),
        expectedStatus: [400, 404],
        shouldPass: false,
    });

    return testCases;
}

/**
 * Build security test cases
 */
function buildSecurityTestCases(route: Route, baseUrl: string): TestCase[] {
    const testCases: TestCase[] = [];

    if (!route.bodySchema) {
        return testCases;
    }

    const fieldNames = Object.keys(route.bodySchema);
    if (fieldNames.length === 0) {
        return testCases;
    }

    const firstField = fieldNames[0];

    // SQL Injection
    const sqlBody = generateValidPayload(route.bodySchema);
    sqlBody[firstField] = generateSqlInjection();

    testCases.push({
        id: uuidv4(),
        route,
        name: 'SQL Injection attempt',
        type: 'sql-injection',
        method: route.method,
        url: buildUrl(baseUrl, route.path, route.params),
        body: sqlBody,
        expectedStatus: [400, 422], // Should be rejected
        shouldPass: false,
    });

    // XSS Attempt
    const xssBody = generateValidPayload(route.bodySchema);
    xssBody[firstField] = generateXssAttempt();

    testCases.push({
        id: uuidv4(),
        route,
        name: 'XSS attempt',
        type: 'xss-attempt',
        method: route.method,
        url: buildUrl(baseUrl, route.path, route.params),
        body: xssBody,
        expectedStatus: [400, 422], // Should be sanitized or rejected
        shouldPass: false,
    });

    return testCases;
}

/**
 * Build fuzzing test cases
 */
function buildFuzzingTestCases(route: Route, baseUrl: string, count: number): TestCase[] {
    const testCases: TestCase[] = [];

    for (let i = 0; i < count; i++) {
        const body = route.bodySchema ? generateFuzzedPayload(route.bodySchema) : undefined;
        const query = route.querySchema ? generateFuzzedPayload(route.querySchema) : undefined;

        testCases.push({
            id: uuidv4(),
            route,
            name: `Fuzz test ${i + 1}`,
            type: 'fuzzing',
            method: route.method,
            url: buildUrl(baseUrl, route.path, route.params),
            body,
            query,
            expectedStatus: [400, 422, 500], // Fuzzing may cause various errors
            shouldPass: false,
        });
    }

    return testCases;
}

/**
 * Generate valid payload from schema
 */
function generateValidPayload(schema: FieldSchema): Record<string, any> {
    const payload: Record<string, any> = {};

    for (const [fieldName, fieldDef] of Object.entries(schema)) {
        payload[fieldName] = generateValidValue(fieldDef);
    }

    return payload;
}

/**
 * Generate fuzzed payload from schema
 */
function generateFuzzedPayload(schema: FieldSchema): Record<string, any> {
    const payload: Record<string, any> = {};

    for (const fieldName of Object.keys(schema)) {
        payload[fieldName] = generateFuzzValue();
    }

    return payload;
}

/**
 * Build URL with parameters
 */
function buildUrl(
    baseUrl: string,
    path: string,
    params?: string[],
    paramValues?: Record<string, string>
): string {
    let url = baseUrl.replace(/\/$/, '') + path;

    if (params && params.length > 0) {
        for (const param of params) {
            const value = paramValues?.[param] || `test-${param}-123`;
            url = url.replace(`:${param}`, value).replace(`[${param}]`, value);
        }
    }

    return url;
}
