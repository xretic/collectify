import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const MAX_ATTEMPTS = 5;

export async function generateAuthToken(): Promise<string> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const token = crypto.randomBytes(16).toString('hex');

        const exists = await prisma.user.findUnique({
            where: { token },
            select: { id: true },
        });

        if (!exists) {
            return token;
        }
    }

    throw new Error('Failed to generate unique token after multiple attempts');
}
