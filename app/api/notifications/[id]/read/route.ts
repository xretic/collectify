import { json, parseId, route } from '@/shared/server/http';
import { publishToUsers } from '@/shared/server/realtime';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { markNotificationRead } from '@/entities/notification/server/queries';
import { requireViewer } from '@/features/auth/server/guards';

export const PATCH = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);
    const unread = await markNotificationRead(viewer.userId, parseId(params.id));

    // Keeps the badge in the user's other tabs in sync.
    await publishToUsers([viewer.userId], 'notification:removed', { ids: [], unread });

    return json({ unread });
});
