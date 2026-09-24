import { NextResponse } from 'next/server';
import { route } from '@/shared/server/http';
import {
    clearSessionCookie,
    deleteSession,
    readSessionId,
} from '@/entities/session/server/session';

export const POST = route(async (req) => {
    const sessionId = readSessionId(req);
    if (sessionId) await deleteSession(sessionId);

    const res = new NextResponse(null, { status: 204 });
    clearSessionCookie(res);

    return res;
});
