import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        // Migrations need a direct (non-pooled) connection for advisory locks.
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
});
