import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

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
 * Find files matching patterns
 */
export async function findFiles(
    baseDir: string,
    patterns: string[],
    excludePatterns: string[] = []
): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of patterns) {
        const files = await glob(pattern, {
            cwd: baseDir,
            absolute: true,
            ignore: excludePatterns,
            nodir: true,
        });
        allFiles.push(...files);
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
