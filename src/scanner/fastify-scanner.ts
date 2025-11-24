import * as t from '@babel/types';
import traverse from '@babel/traverse';
import { Route, HttpMethod } from '../types';
import {
    parseFile,
    getStringValue,
    extractObjectProperties,
    extractRouteHandler,
} from './ast-utils';
import { inferSchemaFromHandler, extractUrlParams } from './schema-inference';
import { logger } from '../utils/logger';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Scan Fastify routes from a file
 */
export function scanFastifyRoutes(filePath: string): Route[] {
    const routes: Route[] = [];
    const ast = parseFile(filePath);

    if (!ast) {
        logger.debug(`Failed to parse file: ${filePath}`);
        return routes;
    }

    traverse(ast, {
        CallExpression(path) {
            const node = path.node;

            if (!t.isMemberExpression(node.callee)) {
                return;
            }

            const object = node.callee.object;
            const property = node.callee.property;

            if (!t.isIdentifier(object) || !t.isIdentifier(property)) {
                return;
            }

            const objectName = object.name;
            const methodName = property.name;

            // Check if object is 'fastify'
            if (objectName !== 'fastify') {
                return;
            }

            // Pattern 1: fastify.get(path, handler)
            if (HTTP_METHODS.includes(methodName.toUpperCase() as HttpMethod)) {
                const args = node.arguments;
                if (args.length === 0) {
                    return;
                }

                const pathNode = args[0];
                const routePath = getStringValue(pathNode);

                if (!routePath) {
                    return;
                }

                const handler = extractRouteHandler(args);
                const { bodySchema, querySchema } = handler
                    ? inferSchemaFromHandler(filePath, handler)
                    : {};

                const params = extractUrlParams(routePath);

                const route: Route = {
                    method: methodName.toUpperCase() as HttpMethod,
                    path: routePath,
                    framework: 'fastify',
                    filePath,
                    bodySchema,
                    querySchema,
                    params,
                };

                routes.push(route);
                logger.debug(`Found Fastify route: ${methodName.toUpperCase()} ${routePath}`);
            }

            // Pattern 2: fastify.route({ method, url, handler })
            if (methodName === 'route') {
                const args = node.arguments;
                if (args.length === 0) {
                    return;
                }

                const routeConfig = args[0];
                if (!t.isObjectExpression(routeConfig)) {
                    return;
                }

                const props = extractObjectProperties(routeConfig);

                const methodNode = props.method;
                const urlNode = props.url;
                const handlerNode = props.handler;

                const method = getStringValue(methodNode);
                const url = getStringValue(urlNode);

                if (!method || !url) {
                    return;
                }

                const { bodySchema, querySchema } = handlerNode
                    ? inferSchemaFromHandler(filePath, handlerNode)
                    : {};

                const params = extractUrlParams(url);

                const route: Route = {
                    method: method.toUpperCase() as HttpMethod,
                    path: url,
                    framework: 'fastify',
                    filePath,
                    bodySchema,
                    querySchema,
                    params,
                };

                routes.push(route);
                logger.debug(`Found Fastify route: ${method.toUpperCase()} ${url}`);
            }
        },
    });

    return routes;
}

/**
 * Check if file contains Fastify patterns
 */
export function isFastifyFile(filePath: string): boolean {
    const ast = parseFile(filePath);
    if (!ast) {
        return false;
    }

    let hasFastify = false;

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
                        objectName === 'fastify' &&
                        (HTTP_METHODS.includes(methodName.toUpperCase() as HttpMethod) ||
                            methodName === 'route')
                    ) {
                        hasFastify = true;
                        path.stop();
                    }
                }
            }
        },
    });

    return hasFastify;
}
