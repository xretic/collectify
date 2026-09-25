import { z } from 'zod';
import { noContent, readBody, route } from '@/shared/server/http';
import { db } from '@/shared/server/db';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';

/**
 * Board tab keys only: "For you" and "Explore" are pinned first and never stored.
 * Unknown or deleted boards are ignored by the client when reading.
 */
const bodySchema = z.object({
    order: z
        .array(z.string().regex(/^board:\d{1,10}$/))
        .max(100)
        .transform((order) => [...new Set(order)]),
});

export const PUT = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const { order } = await readBody(req, bodySchema);
    await db.user.update({ where: { id: viewer.userId }, data: { feedTabOrder: order } });

    return noContent();
});
