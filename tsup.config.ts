import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        dts: true,
        splitting: false,
        sourcemap: true,
        clean: true,
    },
    {
        entry: { 'cli/index': 'src/cli/index.ts' },
        format: ['cjs'],
        dts: true,
        splitting: false,
        sourcemap: true,
    },
]);
