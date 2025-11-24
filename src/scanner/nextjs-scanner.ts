import * as path from 'path';
import * as t from '@babel/types';
import traverse from '@babel/traverse';
import { Route, HttpMethod } from '../types';
import { parseFile } from './ast-utils';
import { inferSchemaFromHandler, extractUrlParams } from './schema-inference';
import { logger } from '../utils/logger';
import { findFiles } from '../utils/file-utils';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Scan Next.js API routes from project directory
 */
export async function scanNextJsRoutes(projectPath: string): Promise<Route[]> {
    const routes: Route[] = [];

    // Find API route files in both pages and app directory
    const pagesApiFiles = await findFiles(projectPath, ['**/pages/api/**/*.{js,ts,jsx,tsx}']);
    const appApiFiles = await findFiles(projectPath, ['**/app/**/route.{js,ts,jsx,tsx}']);

    const allApiFiles = [...pagesApiFiles, ...appApiFiles];

    for (const filePath of allApiFiles) {
        const fileRoutes = scanNextJsFile(filePath, projectPath);
        routes.push(...fileRoutes);
    }

    return routes;
}

/**
 * Scan a single Next.js API route file
 */
function scanNextJsFile(filePath: string, projectPath: string): Route[] {
    const routes: Route[] = [];
    const ast = parseFile(filePath);

    if (!ast) {
        logger.debug(`Failed to parse file: ${filePath}`);
        return routes;
    }

    // Determine route path from file path
    const routePath = getNextJsRoutePath(filePath, projectPath);

    // Pattern 1: App Router - export async function GET/POST/etc
    traverse(ast, {
        ExportNamedDeclaration(path) {
            const declaration = path.node.declaration;

            if (t.isFunctionDeclaration(declaration) && declaration.id) {
                const functionName = declaration.id.name;

                if (HTTP_METHODS.includes(functionName as HttpMethod)) {
                    const { bodySchema, querySchema } = inferSchemaFromHandler(filePath, declaration);
                    const params = extractUrlParams(routePath);

                    const route: Route = {
                        method: functionName as HttpMethod,
                        path: routePath,
                        framework: 'nextjs',
                        filePath,
                        bodySchema,
                        querySchema,
                        params,
                        handlerName: functionName,
                    };

                    routes.push(route);
                    logger.debug(`Found Next.js route: ${functionName} ${routePath}`);
                }
            }
        },
    });

    // Pattern 2: Pages Router - export default function handler
    traverse(ast, {
        ExportDefaultDeclaration(path) {
            const declaration = path.node.declaration;

            if (t.isFunctionDeclaration(declaration) || t.isArrowFunctionExpression(declaration)) {
                const { bodySchema, querySchema } = inferSchemaFromHandler(filePath, declaration);
                const params = extractUrlParams(routePath);

                // Pages router handles all methods, but we'll default to GET and POST
                for (const method of ['GET', 'POST'] as HttpMethod[]) {
                    const route: Route = {
                        method,
                        path: routePath,
                        framework: 'nextjs',
                        filePath,
                        bodySchema,
                        querySchema,
                        params,
                        handlerName: 'handler',
                    };

                    routes.push(route);
                }

                logger.debug(`Found Next.js Pages route: ${routePath}`);
            }
        },
    });

    return routes;
}

/**
 * Convert file path to Next.js route path
 */
function getNextJsRoutePath(filePath: string, projectPath: string): string {
    const relativePath = path.relative(projectPath, filePath);

    // Remove file extension
    let routePath = relativePath.replace(/\.(js|ts|jsx|tsx)$/, '');

    // Handle pages/api directory
    if (routePath.startsWith('pages/api/')) {
        routePath = routePath.replace('pages/api/', '/api/');
    }

    // Handle app directory
    if (routePath.includes('/app/')) {
        const appIndex = routePath.indexOf('/app/');
        routePath = routePath.substring(appIndex + 4); // Remove everything before /app/
        routePath = routePath.replace('/route', ''); // Remove /route from path
    }

    // Convert [param] to :param for consistency
    routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');

    // Remove /index from the end
    routePath = routePath.replace(/\/index$/, '');

    // Ensure it starts with /
    if (!routePath.startsWith('/')) {
        routePath = '/' + routePath;
    }

    // Handle root index
    if (routePath === '/') {
        routePath = '/';
    }

    return routePath;
}

/**
 * Check if file is a Next.js API route
 */
export function isNextJsApiRoute(filePath: string): boolean {
    return (
        (filePath.includes('/pages/api/') || filePath.includes('/app/')) &&
        /\.(js|ts|jsx|tsx)$/.test(filePath)
    );
}
