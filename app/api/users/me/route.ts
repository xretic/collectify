import { after, NextResponse } from 'next/server';
import { forbidden, json, readBody, route, unauthorized } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { clearSessionCookie } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { requireViewer } from '@/features/auth/server/guards';
import { deleteOwnAccount } from '@/features/auth/server/accounts';
import { deleteAccountSchema, updateProfileSchema } from '@/features/auth/model/schemas';
import { updateProfile } from '@/features/user/server/profile';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { refreshProfileImage } from '@/shared/server/shareImages';
import { writeAudit } from '@/entities/moderation/server/audit';
import { COLLECTIONS_CACHE_NAMESPACE } from '@/entities/collection/server/queries';

const CARD_AUTHOR_FIELDS = ['username', 'fullName', 'avatarUrl'] as const;

export const PATCH = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const input = await readBody(req, updateProfileSchema);
    await updateProfile(viewer.userId, input);
    // Staff signed in as the user (e.g. to fix an abusive name): recorded like other moderation.
    if (viewer.session.impersonatorUserId) {
        await writeAudit(viewer.actor, {
            action: 'edit-profile',
            targetUserId: viewer.userId,
            metadata: input,
        });
    }
    refreshProfileImage(viewer.userId);
    // Cached collection cards show only these author fields.
    if (CARD_AUTHOR_FIELDS.some((field) => input[field] !== undefined)) {
        await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
    }

    const user = await getSessionUser(viewer.userId, viewer.session.impersonatorUserId);
    if (!user) throw unauthorized();

    return json({ user });
});

export const DELETE = route(async (req) => {
    const viewer = await requireViewer(req);
    // Staff delete accounts from the management page, where it is audited.
    if (viewer.session.impersonatorUserId) throw forbidden();
    await enforceRateLimit(req, 'auth', viewer.userId);

    const { confirmation } = await readBody(req, deleteAccountSchema);
    const deleteUploads = await deleteOwnAccount(viewer.userId, confirmation);
    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);

    after(() =>
        deleteUploads().catch((error) => console.error('[account] uploads not deleted:', error)),
    );

    const res = new NextResponse(null, { status: 204 });
    clearSessionCookie(res);

    return res;
});
