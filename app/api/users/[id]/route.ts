import { json, notFound, parseId, route } from '@/shared/server/http';
import { getPublicUser } from '@/entities/user/server/profile';
import { getViewer } from '@/features/auth/server/guards';

export const GET = route<{ id: string }>(async (req, params) => {
    const userId = parseId(params.id, 'user id');
    const viewer = await getViewer(req);

    const user = await getPublicUser(userId, viewer?.userId ?? null);
    if (!user) throw notFound('User not found.');

    return json({ user });
});
