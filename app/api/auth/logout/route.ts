import { NextResponse } from 'next/server';
import { route } from '@/shared/server/http';
import {
    clearSessionCookie,
    deleteSession,
    findActiveSession,
    readSessionId,
} from '@/entities/session/server/session';
import { dropRevokedConnections } from '@/shared/server/realtime';

export const POST = route(async (req) => {
    const sessionId = readSessionId(req);
    if (sessionId) {
        const session = await findActiveSession(sessionId);
        await deleteSession(sessionId);
        if (session) await dropRevokedConnections([session.userId]);
    }

    const res = new NextResponse(null, { status: 204 });
    clearSessionCookie(res);

    return res;
});
