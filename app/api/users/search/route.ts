import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { db } from '@/shared/server/db';
import { USERNAME_MAX_LENGTH } from '@/shared/lib/constants';

const querySchema = z.object({
    q: z.string().trim().toLowerCase().min(1).max(USERNAME_MAX_LENGTH),
});

export const GET = route(async (req) => {
    await enforceRateLimit(req, 'search');

    const { q } = readQuery(req, querySchema);

    const users = await db.user.findMany({
        where: { username: { startsWith: q } },
        orderBy: { username: 'asc' },
        take: 5,
        select: { id: true, username: true, avatarUrl: true },
    });

    return json({ users });
});
