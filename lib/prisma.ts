import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL not set in .env');
}

const adapter = new PrismaNeon({ connectionString });
export const prisma = new PrismaClient({ adapter });
