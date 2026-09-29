import { json, notFound, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { getPublicUser } from '@/entities/user/server/profile';
import { getViewer } from '@/features/auth/server/guards';

export const GET = route<{ id: string }>(async (req, params) => {
    const userId = parseId(params.id);
    const viewer = await getViewer(req);
    await enforceRateLimit(req, 'read', viewer?.userId);

    const user = await getPublicUser(userId, viewer?.userId ?? null);
    if (!user) throw notFound('userNotFound');

    return json({ user });
});
