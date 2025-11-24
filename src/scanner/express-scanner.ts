import * as t from '@babel/types';
import traverse from '@babel/traverse';
import { Route, HttpMethod } from '../types';
import {
    parseFile,
    getStringValue,
    isMethodCall,
    extractRouteHandler,
} from './ast-utils';
import { inferSchemaFromHandler, extractUrlParams } from './schema-inference';
import { logger } from '../utils/logger';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Scan Express routes from a file
 */
export function scanExpressRoutes(filePath: string): Route[] {
    const routes: Route[] = [];
    const ast = parseFile(filePath);

    if (!ast) {
        logger.debug(`Failed to parse file: ${filePath}`);
        return routes;
    }

    traverse(ast, {
        CallExpression(path) {
            const node = path.node;

            // Check for app.METHOD() or router.METHOD() patterns
            if (t.isMemberExpression(node.callee)) {
                const object = node.callee.object;
                const property = node.callee.property;

                if (!t.isIdentifier(object) || !t.isIdentifier(property)) {
                    return;
                }

                const objectName = object.name;
                const methodName = property.name.toUpperCase();

                // Check if it's a valid HTTP method
                if (!HTTP_METHODS.includes(methodName as HttpMethod)) {
                    return;
                }

                // Check if object is 'app' or 'router'
                if (objectName !== 'app' && objectName !== 'router') {
                    return;
                }

                // Extract route path (first argument)
                const args = node.arguments;
                if (args.length === 0) {
                    return;
                }

                const pathNode = args[0];
                const routePath = getStringValue(pathNode);

                if (!routePath) {
                    return;
                }

                // Extract handler (last function argument)
                const handler = extractRouteHandler(args);

                // Infer schema from handler
                const { bodySchema, querySchema } = handler
                    ? inferSchemaFromHandler(filePath, handler)
                    : {};

                // Extract URL parameters
                const params = extractUrlParams(routePath);

                const route: Route = {
                    method: methodName as HttpMethod,
                    path: routePath,
                    framework: 'express',
                    filePath,
                    bodySchema,
                    querySchema,
                    params,
                };

                routes.push(route);
                logger.debug(`Found Express route: ${methodName} ${routePath}`);
            }

            // Check for app.use() with router
            if (isMethodCall(node, 'app', 'use') || isMethodCall(node, 'router', 'use')) {
                const args = node.arguments;
                if (args.length >= 1) {
                    const firstArg = args[0];
                    const basePath = getStringValue(firstArg);

                    // If base path is found, it might be a router mount point
                    // We'll note this for potential future enhancement
                    if (basePath) {
                        logger.debug(`Found router mount point: ${basePath}`);
                    }
                }
            }
        },
    });

    return routes;
}

/**
 * Check if file contains Express patterns
 */
export function isExpressFile(filePath: string): boolean {
    const ast = parseFile(filePath);
    if (!ast) {
        return false;
    }

    let hasExpress = false;

    traverse(ast, {
        CallExpression(path) {
            const node = path.node;

            if (t.isMemberExpression(node.callee)) {
                const object = node.callee.object;
                const property = node.callee.property;

                if (t.isIdentifier(object) && t.isIdentifier(property)) {
                    const objectName = object.name;
                    const methodName = property.name;

                    if (
                        (objectName === 'app' || objectName === 'router') &&
                        HTTP_METHODS.includes(methodName.toUpperCase() as HttpMethod)
                    ) {
                        hasExpress = true;
                        path.stop();
                    }
                }
            }
        },
    });

    return hasExpress;
}
