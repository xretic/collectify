import 'server-only';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import {
    findActiveSession,
    readSessionId,
    SESSION_COOKIE,
    type AuthSession,
} from '@/entities/session/server/session';
import { getActiveSanction, sanctionMessage } from '@/entities/sanction/server/sanctions';
import { getUserRoles } from '@/entities/user/server/roles';
import type { UserRole } from '@/entities/user/model/types';
import type { ModerationActor } from '@/entities/moderation/server/audit';
import { forbidden, unauthorized } from '@/shared/server/http';

export type Viewer = {
    session: AuthSession;
    userId: number;
    actor: ModerationActor;
};

type ViewerResult =
    | { viewer: Viewer; banned: null }
    | { viewer: null; banned: Date | null | undefined };

async function resolveViewer(sessionId: string | undefined): Promise<ViewerResult> {
    const session = await findActiveSession(sessionId);
    if (!session) return { viewer: null, banned: undefined };

    const ban = await getActiveSanction(session.userId, 'ACCOUNT');
    if (ban) return { viewer: null, banned: ban.expiresAt };

    return {
        viewer: {
            session,
            userId: session.userId,
            actor: { userId: session.userId, impersonatorId: session.impersonatorUserId },
        },
        banned: null,
    };
}

/** Signed-in, non-expired, non-banned viewer — or `null`. */
export async function getViewer(req: NextRequest): Promise<Viewer | null> {
    return (await resolveViewer(readSessionId(req))).viewer;
}

/** Same as `getViewer` for server components (reads `cookies()`). */
export async function getViewerFromCookies(): Promise<Viewer | null> {
    const store = await cookies();
    return (await resolveViewer(store.get(SESSION_COOKIE)?.value)).viewer;
}

/** 401 without a valid session, 403 with a message when the account is banned. */
export async function requireViewer(req: NextRequest): Promise<Viewer> {
    const result = await resolveViewer(readSessionId(req));
    if (result.viewer) return result.viewer;

    if (result.banned !== undefined) {
        throw forbidden(sanctionMessage('Your account is banned.', result.banned));
    }

    throw unauthorized();
}

/**
 * Like `requireViewer`, but also refuses impersonated sessions: direct messages
 * stay private, so staff signed in as a user can neither read nor send them.
 */
export async function requireChatViewer(req: NextRequest): Promise<Viewer> {
    const viewer = await requireViewer(req);
    if (viewer.session.impersonatorUserId) {
        throw forbidden('Chats are not available while signed in as another user.');
    }

    return viewer;
}

export type StaffContext = Viewer & {
    roles: UserRole[];
    isAdmin: boolean;
    isModerator: boolean;
};

export async function requireStaff(
    req: NextRequest,
    options: { adminOnly?: boolean } = {},
): Promise<StaffContext> {
    return toStaffContext(await requireViewer(req), options);
}

/** Upgrades an already-authenticated viewer to a staff context (403 otherwise). */
export async function toStaffContext(
    viewer: Viewer,
    { adminOnly = false }: { adminOnly?: boolean } = {},
): Promise<StaffContext> {
    const roles = await getUserRoles(viewer.userId);
    const isAdmin = roles.includes('Admin');
    const isModerator = roles.includes('Moderator');

    if (adminOnly ? !isAdmin : !isAdmin && !isModerator) throw forbidden();

    return { ...viewer, roles, isAdmin, isModerator };
}

/**
 * Staff hierarchy: nobody moderates themselves; admins manage everyone except
 * other admins; moderators manage regular users only.
 */
export async function assertCanModerate(ctx: StaffContext, targetUserId: number) {
    if (ctx.userId === targetUserId) throw forbidden('You cannot moderate yourself.');

    const targetRoles = await getUserRoles(targetUserId);

    if (targetRoles.includes('Admin')) throw forbidden('Admins cannot be moderated.');

    if (!ctx.isAdmin && targetRoles.includes('Moderator')) {
        throw forbidden('Moderators cannot manage other moderators.');
    }
}
