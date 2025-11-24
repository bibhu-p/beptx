import * as t from '@babel/types';
import { FieldSchema, FieldDefinition } from '../types';
import { FIELD_TYPE_MAPPINGS } from '../config/defaults';
import {
    parseFile,
    findMemberAccesses,
    extractFunctionParams,
    extractRouteHandler,
} from './ast-utils';

/**
 * Infer schema from route handler code
 */
export function inferSchemaFromHandler(
    filePath: string,
    handlerNode: t.Node | null
): {
    bodySchema?: FieldSchema;
    querySchema?: FieldSchema;
} {
    const ast = parseFile(filePath);
    if (!ast) {
        return {};
    }

    const bodyFields = findMemberAccesses(ast, 'req', 'body');
    const queryFields = findMemberAccesses(ast, 'req', 'query');

    return {
        bodySchema: bodyFields.length > 0 ? inferFieldTypes(bodyFields) : undefined,
        querySchema: queryFields.length > 0 ? inferFieldTypes(queryFields) : undefined,
    };
}

/**
 * Infer field types from field names
 */
export function inferFieldTypes(fieldNames: string[]): FieldSchema {
    const schema: FieldSchema = {};

    for (const fieldName of fieldNames) {
        schema[fieldName] = inferFieldType(fieldName);
    }

    return schema;
}

/**
 * Infer field type from field name
 */
export function inferFieldType(fieldName: string): FieldDefinition {
    const lowerName = fieldName.toLowerCase();

    // Check exact matches first
    if (FIELD_TYPE_MAPPINGS[fieldName]) {
        return createFieldDefinition(FIELD_TYPE_MAPPINGS[fieldName]);
    }

    // Check partial matches
    for (const [key, type] of Object.entries(FIELD_TYPE_MAPPINGS)) {
        if (lowerName.includes(key.toLowerCase())) {
            return createFieldDefinition(type);
        }
    }

    // Pattern-based inference
    if (lowerName.includes('email') || lowerName.includes('mail')) {
        return createFieldDefinition('email');
    }

    if (lowerName.includes('url') || lowerName.includes('link') || lowerName.includes('website')) {
        return createFieldDefinition('url');
    }

    if (
        lowerName.includes('date') ||
        lowerName.includes('time') ||
        lowerName.includes('created') ||
        lowerName.includes('updated')
    ) {
        return createFieldDefinition('date');
    }

    if (
        lowerName.includes('is') ||
        lowerName.includes('has') ||
        lowerName.includes('enabled') ||
        lowerName.includes('active')
    ) {
        return createFieldDefinition('boolean');
    }

    if (
        lowerName.includes('count') ||
        lowerName.includes('age') ||
        lowerName.includes('price') ||
        lowerName.includes('amount') ||
        lowerName.includes('quantity') ||
        lowerName.includes('number') ||
        lowerName.includes('num')
    ) {
        return createFieldDefinition('number');
    }

    if (lowerName.includes('id')) {
        return createFieldDefinition('string');
    }

    // Default to string
    return createFieldDefinition('string');
}

/**
 * Create field definition based on type
 */
function createFieldDefinition(type: string): FieldDefinition {
    const definition: FieldDefinition = {
        type: type as any,
        required: true, // Assume required by default
    };

    // Add type-specific constraints
    switch (type) {
        case 'email':
            definition.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
            break;
        case 'url':
            definition.pattern = '^https?://';
            break;
        case 'string':
            definition.minLength = 1;
            definition.maxLength = 255;
            break;
        case 'number':
            definition.min = 0;
            definition.max = 1000000;
            break;
    }

    return definition;
}

/**
 * Extract URL parameters from path
 */
export function extractUrlParams(path: string): string[] {
    const params: string[] = [];
    const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;

    while ((match = paramRegex.exec(path)) !== null) {
        params.push(match[1]);
    }

    // Also check for Next.js style params [param]
    const nextParamRegex = /\[([a-zA-Z_][a-zA-Z0-9_]*)\]/g;
    while ((match = nextParamRegex.exec(path)) !== null) {
        params.push(match[1]);
    }

    return params;
}

/**
 * Merge multiple schemas
 */
export function mergeSchemas(...schemas: (FieldSchema | undefined)[]): FieldSchema {
    const merged: FieldSchema = {};

    for (const schema of schemas) {
        if (schema) {
            Object.assign(merged, schema);
        }
    }

    return merged;
}
