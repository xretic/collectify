import { json, route, unauthorized } from '@/shared/server/http';
import { getSessionUser } from '@/entities/user/server/profile';
import { requireViewer } from '@/features/auth/server/guards';

export const GET = route(async (req) => {
    const viewer = await requireViewer(req);
    const user = await getSessionUser(viewer.userId, viewer.session.impersonatorUserId);

    if (!user) throw unauthorized();

    return json({ user });
});
