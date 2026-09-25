import { noContent, route } from '@/shared/server/http';
import { publishToUsers } from '@/shared/server/realtime';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { markAllNotificationsRead } from '@/entities/notification/server/queries';
import { requireViewer } from '@/features/auth/server/guards';

export const PATCH = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);
    await markAllNotificationsRead(viewer.userId);

    // Keeps the badge in the user's other tabs in sync.
    await publishToUsers([viewer.userId], 'notification:removed', { ids: [], unread: 0 });

    return noContent();
});
