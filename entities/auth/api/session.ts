import { prisma } from '@/shared/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSanction } from '@/entities/management/api/server';

async function getSession(req: NextRequest) {
    const sessionId = req.cookies.get('sessionId')?.value;
    if (!sessionId) return null;

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) return null;

    return session;
}

export async function requireActiveSession(req: NextRequest) {
    const session = await getSession(req);

    if (!session) {
        return {
            response: NextResponse.json({ message: 'Unauthorized.' }, { status: 401 }),
            session: null,
        };
    }

    const accountBan = await getActiveSanction(session.userId, 'ACCOUNT');

    if (accountBan) {
        return {
            response: NextResponse.json(
                { message: sanctionMessage('Your account is banned.', accountBan.expiresAt) },
                { status: 403 },
            ),
            session: null,
        };
    }

    return { response: null, session };
}

function sanctionMessage(prefix: string, expiresAt: Date | null) {
    if (!expiresAt) return `${prefix} This restriction is permanent.`;

    return `${prefix} It expires at ${expiresAt.toISOString()}.`;
}
