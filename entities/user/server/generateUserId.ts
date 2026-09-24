import 'server-only';
import { randomInt } from 'node:crypto';
import { db } from '@/shared/server/db';

/** Random 9-digit public id; retries on the (rare) collision. */
export async function generateUserId(): Promise<number> {
    for (;;) {
        const id = randomInt(100_000_000, 1_000_000_000);
        const existing = await db.user.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return id;
    }
}
