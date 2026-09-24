import 'server-only';
import { randomBytes } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/server/db';
import { isProduction } from '@/shared/server/env';
import { SESSION_AGE_IN_DAYS } from '@/shared/lib/constants';

export const SESSION_COOKIE = 'sessionId';

const SESSION_MAX_AGE_SECONDS = SESSION_AGE_IN_DAYS * 24 * 60 * 60;

export type AuthSession = {
    id: string;
    userId: number;
    impersonatorUserId: number | null;
    expiresAt: Date;
};

const sessionSelect = {
    id: true,
    userId: true,
    impersonatorUserId: true,
    expiresAt: true,
} as const;

export function readSessionId(req: NextRequest): string | undefined {
    return req.cookies.get(SESSION_COOKIE)?.value || undefined;
}

/** Returns the session only if it exists and has not expired. */
export async function findActiveSession(
    sessionId: string | undefined,
): Promise<AuthSession | null> {
    if (!sessionId) return null;

    const session = await db.session.findUnique({
        where: { id: sessionId },
        select: sessionSelect,
    });
    if (!session || session.expiresAt <= new Date()) return null;

    return session;
}

export async function createSession(userId: number): Promise<AuthSession> {
    // Opportunistic cleanup keeps the table from growing forever.
    await db.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });

    return db.session.create({
        data: {
            id: randomBytes(32).toString('base64url'),
            userId,
            expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
        },
        select: sessionSelect,
    });
}

export async function deleteSession(sessionId: string) {
    await db.session.deleteMany({ where: { id: sessionId } });
}

export function setSessionCookie(res: NextResponse, session: AuthSession) {
    res.cookies.set({
        name: SESSION_COOKIE,
        value: session.id,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: isProduction,
        expires: session.expiresAt,
    });
}

export function clearSessionCookie(res: NextResponse) {
    res.cookies.set({
        name: SESSION_COOKIE,
        value: '',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 0,
    });
}
