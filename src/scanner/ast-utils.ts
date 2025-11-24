import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { readFile } from '../utils/file-utils';

/**
 * Parse JavaScript/TypeScript file to AST
 */
export function parseFile(filePath: string): t.File | null {
    try {
        const code = readFile(filePath);
        return parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx', 'decorators-legacy'],
        });
    } catch (error) {
        return null;
    }
}

/**
 * Extract string literal value
 */
export function getStringValue(node: t.Node): string | null {
    if (t.isStringLiteral(node)) {
        return node.value;
    }
    if (t.isTemplateLiteral(node) && node.quasis.length === 1) {
        return node.quasis[0].value.raw;
    }
    return null;
}

/**
 * Extract identifier name
 */
export function getIdentifierName(node: t.Node): string | null {
    if (t.isIdentifier(node)) {
        return node.name;
    }
    return null;
}

/**
 * Check if node is a method call
 */
export function isMethodCall(
    node: t.Node,
    objectName: string,
    methodName: string
): boolean {
    if (!t.isCallExpression(node)) {
        return false;
    }

    const callee = node.callee;
    if (!t.isMemberExpression(callee)) {
        return false;
    }

    const object = callee.object;
    const property = callee.property;

    const matchesObject = t.isIdentifier(object) && object.name === objectName;
    const matchesMethod = t.isIdentifier(property) && property.name === methodName;

    return matchesObject && matchesMethod;
}

/**
 * Extract object properties as key-value pairs
 */
export function extractObjectProperties(node: t.Node): Record<string, any> {
    const result: Record<string, any> = {};

    if (!t.isObjectExpression(node)) {
        return result;
    }

    for (const prop of node.properties) {
        if (t.isObjectProperty(prop)) {
            const key = t.isIdentifier(prop.key) ? prop.key.name : getStringValue(prop.key);
            if (key) {
                result[key] = prop.value;
            }
        }
    }

    return result;
}

/**
 * Find all variable declarations in AST
 */
export function findVariableDeclarations(ast: t.File): Map<string, t.Node> {
    const variables = new Map<string, t.Node>();

    traverse(ast, {
        VariableDeclarator(path) {
            const id = path.node.id;
            const init = path.node.init;

            if (t.isIdentifier(id) && init) {
                variables.set(id.name, init);
            }
        },
    });

    return variables;
}

/**
 * Extract function parameters
 */
export function extractFunctionParams(node: t.Node): string[] {
    const params: string[] = [];

    if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
        for (const param of node.params) {
            if (t.isIdentifier(param)) {
                params.push(param.name);
            } else if (t.isObjectPattern(param)) {
                // Extract destructured parameters
                for (const prop of param.properties) {
                    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                        params.push(prop.key.name);
                    }
                }
            }
        }
    }

    return params;
}

/**
 * Find member expression accesses (e.g., req.body.email)
 */
export function findMemberAccesses(
    ast: t.File,
    objectName: string,
    propertyName: string
): string[] {
    const accesses: string[] = [];

    traverse(ast, {
        MemberExpression(path) {
            // Check for patterns like req.body.fieldName
            const node = path.node;

            if (
                t.isMemberExpression(node.object) &&
                t.isIdentifier(node.object.object) &&
                node.object.object.name === objectName &&
                t.isIdentifier(node.object.property) &&
                node.object.property.name === propertyName &&
                t.isIdentifier(node.property)
            ) {
                accesses.push(node.property.name);
            }
        },
    });

    return Array.from(new Set(accesses));
}

/**
 * Extract route handler function
 */
export function extractRouteHandler(args: t.Node[]): t.Node | null {
    // Handler is typically the last argument
    for (let i = args.length - 1; i >= 0; i--) {
        const arg = args[i];
        if (t.isFunctionExpression(arg) || t.isArrowFunctionExpression(arg)) {
            return arg;
        }
        if (t.isIdentifier(arg)) {
            return arg;
        }
    }
    return null;
}

/**
 * Check if code contains pattern
 */
export function containsPattern(code: string, pattern: string): boolean {
    return code.includes(pattern);
}
