import 'server-only';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Prisma, PrismaClient } from '@/generated/prisma/client';
import { serverEnv } from './env';

export type Tx = Prisma.TransactionClient;

function createClient() {
    neonConfig.webSocketConstructor = ws;
    return new PrismaClient({
        adapter: new PrismaNeon({ connectionString: serverEnv.DATABASE_URL }),
    });
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

/**
 * Locks a row until the transaction ends, so concurrent count-then-write checks
 * on its children (limits, "at least one item") run one after another.
 */
export async function lockRow(tx: Tx, table: 'User' | 'Collection', id: number) {
    if (table === 'User') await tx.$queryRaw`SELECT 1 FROM "User" WHERE "id" = ${id} FOR UPDATE`;
    else await tx.$queryRaw`SELECT 1 FROM "Collection" WHERE "id" = ${id} FOR UPDATE`;
}

/** Escapes `%`, `_` and backslashes, so a LIKE pattern matches them literally. */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);
