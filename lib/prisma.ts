import 'dotenv/config';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL not set in .env');
}

// Neon serverless driver needs a WebSocket implementation in the Node runtime
// (server.mjs / API routes). In edge/serverless this is a no-op.
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString });
export const prisma = new PrismaClient({ adapter });
