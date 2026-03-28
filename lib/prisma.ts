import 'dotenv/config';
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL not set in .env');
}

const adapter = new PrismaPostgresAdapter({ connectionString });
export const prisma = new PrismaClient({ adapter });
