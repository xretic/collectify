import { PrismaPostgresAdapter } from '@prisma/adapter-ppg';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const adapter = new PrismaPostgresAdapter({ connectionString });

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
