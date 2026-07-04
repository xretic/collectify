import { getSessionUserResponse } from '@/entities/auth/api/getSessionUserResponse';
import { prisma } from '@/shared/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;

        if (!sessionId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                impersonatorUserId: true,
            },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        if (!session.impersonatorUserId) {
            return NextResponse.json({ message: 'Impersonation is not active.' }, { status: 400 });
        }

        const restoredSession = await prisma.session.update({
            where: { id: session.id },
            data: {
                userId: session.impersonatorUserId,
                impersonatorUserId: null,
            },
            include: { user: true },
        });

        const userInResponse: SessionUserInResponse = await getSessionUserResponse(
            restoredSession.user,
            restoredSession,
        );

        return NextResponse.json({ user: userInResponse }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
