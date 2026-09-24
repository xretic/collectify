import { noContent, route } from '@/shared/server/http';
import { markAllNotificationsRead } from '@/entities/notification/server/queries';
import { requireViewer } from '@/features/auth/server/guards';

export const PATCH = route(async (req) => {
    const viewer = await requireViewer(req);
    await markAllNotificationsRead(viewer.userId);

    return noContent();
});
