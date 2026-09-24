import { NextResponse } from 'next/server';
import { json, readBody, route, unauthorized } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { clearSessionCookie } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { requireViewer } from '@/features/auth/server/guards';
import { deleteOwnAccount } from '@/features/auth/server/accounts';
import { deleteAccountSchema, updateProfileSchema } from '@/features/auth/model/schemas';
import { updateProfile } from '@/features/user/server/profile';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { COLLECTIONS_CACHE_NAMESPACE } from '@/entities/collection/server/queries';

export const PATCH = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await updateProfile(viewer.userId, await readBody(req, updateProfileSchema));
    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);

    const user = await getSessionUser(viewer.userId, viewer.session.impersonatorUserId);
    if (!user) throw unauthorized();

    return json({ user });
});

export const DELETE = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'auth', viewer.userId);

    const { confirmation } = await readBody(req, deleteAccountSchema);
    await deleteOwnAccount(viewer.userId, confirmation);
    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);

    const res = new NextResponse(null, { status: 204 });
    clearSessionCookie(res);

    return res;
});
