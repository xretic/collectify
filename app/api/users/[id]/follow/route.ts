import { noContent, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import { follow, unfollow } from '@/features/user/server/profile';

export const PUT = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await follow(viewer.userId, parseId(params.id, 'user id'));
    return noContent();
});

export const DELETE = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await unfollow(viewer.userId, parseId(params.id, 'user id'));
    return noContent();
});
