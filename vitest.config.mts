import path from 'node:path';
import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

export default defineConfig({
    resolve: {
        alias: {
            '@': root,
            // `server-only` throws outside React Server Components; tests are server code.
            'server-only': path.join(root, 'tests/support/empty.ts'),
        },
    },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        // Integration tests share one database, so files run one at a time.
        fileParallelism: false,
        env: process.env.TEST_DATABASE_URL
            ? { DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: 'test' }
            : { NODE_ENV: 'test' },
    },
});
