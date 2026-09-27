import { ApiError, errorResponse, json, route, unauthorized } from '@/shared/server/http';
import { getSessionUser } from '@/entities/user/server/profile';
import { clearSessionCookie, readSessionId } from '@/entities/session/server/session';
import { requireViewer } from '@/features/auth/server/guards';

export const GET = route(async (req) => {
    try {
        const viewer = await requireViewer(req);
        const user = await getSessionUser(viewer.userId, viewer.session.impersonatorUserId);

        if (!user) throw unauthorized();

        return json({ user });
    } catch (error) {
        // A dead session cookie is dropped, so the next page render already treats the visitor as a guest.
        if (error instanceof ApiError && error.status === 401 && readSessionId(req)) {
            const res = await errorResponse(error);
            clearSessionCookie(res);
            return res;
        }
        throw error;
    }
});
