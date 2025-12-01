import * as fs from 'fs';
import * as path from 'path';
import * as fsPromises from 'node:fs/promises';

/**
 * Check if a path exists
 */
export function pathExists(filePath: string): boolean {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

/**
 * Check if a path is a directory
 */
export function isDirectory(filePath: string): boolean {
    try {
        return fs.statSync(filePath).isDirectory();
    } catch {
        return false;
    }
}

/**
 * Read file contents
 */
export function readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Write file contents
 */
export function writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!pathExists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Check if a file path matches any exclude pattern
 */
function matchesExcludePattern(filePath: string, excludePatterns: string[]): boolean {
    return excludePatterns.some((pattern) => {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.');
        const regex = new RegExp(regexPattern);
        return regex.test(filePath);
    });
}

/**
 * Check if a file path matches a glob pattern
 */
function matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.')
        .replace(/\./g, '\\.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
}

/**
 * Find files matching patterns
 */
export async function findFiles(
    baseDir: string,
    patterns: string[],
    excludePatterns: string[] = []
): Promise<string[]> {
    const allFiles: string[] = [];

    // Read all files recursively using native Node.js API (Node 20+)
    const entries = await fsPromises.readdir(baseDir, { recursive: true, withFileTypes: true });

    for (const entry of entries) {
        // Skip directories
        if (!entry.isFile()) continue;

        // Get relative path
        const relativePath = entry.parentPath
            ? path.relative(baseDir, path.join(entry.parentPath, entry.name))
            : entry.name;

        // Check if excluded
        if (matchesExcludePattern(relativePath, excludePatterns)) {
            continue;
        }

        // Check if matches any pattern
        const matchesAnyPattern = patterns.some((pattern) => matchesPattern(relativePath, pattern));

        if (matchesAnyPattern) {
            const absolutePath = path.resolve(baseDir, relativePath);
            allFiles.push(absolutePath);
        }
    }

    // Remove duplicates
    return Array.from(new Set(allFiles));
}

/**
 * Get all JavaScript/TypeScript files in a directory
 */
export async function getSourceFiles(
    baseDir: string,
    exclude: string[] = []
): Promise<string[]> {
    const defaultExclude = [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        ...exclude,
    ];

    return findFiles(baseDir, ['**/*.{js,ts,jsx,tsx}'], defaultExclude);
}

/**
 * Resolve path relative to base directory
 */
export function resolvePath(baseDir: string, relativePath: string): string {
    return path.resolve(baseDir, relativePath);
}

/**
 * Get relative path from base directory
 */
export function getRelativePath(baseDir: string, absolutePath: string): string {
    return path.relative(baseDir, absolutePath);
}
