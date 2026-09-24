import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { idSchema } from '@/shared/lib/validation/ids';
import { listNotifications } from '@/entities/notification/server/queries';
import { requireViewer } from '@/features/auth/server/guards';

const querySchema = z.object({
    onlyUnread: z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
    cursor: idSchema.optional(),
});

export const GET = route(async (req) => {
    const viewer = await requireViewer(req);
    const { onlyUnread, cursor } = readQuery(req, querySchema);

    return json(await listNotifications(viewer.userId, { onlyUnread, cursor: cursor ?? null }));
});
