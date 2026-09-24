import 'server-only';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@/generated/prisma/client';
import { serverEnv } from './env';

export type Tx = Prisma.TransactionClient;

function createClient() {
    const connectionString = serverEnv.DATABASE_URL;

    // Neon (serverless) in production, plain Postgres locally / in Docker.
    if (new URL(connectionString).hostname.endsWith('.neon.tech')) {
        neonConfig.webSocketConstructor = ws;
        return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
    }

    return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForDb = globalThis as unknown as { __collectifyDb?: PrismaClient };

export const db = globalForDb.__collectifyDb ?? createClient();

if (serverEnv.NODE_ENV !== 'production') globalForDb.__collectifyDb = db;

export function isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function isNotFound(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}
