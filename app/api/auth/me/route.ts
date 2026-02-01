import { getSessionUserResponse } from '@/helpers/getSessionUserResponse';
import { prisma } from '@/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const sessionId = req.cookies.get('sessionId')?.value;
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            user: true,
        },
    });

    if (!session || session.expiresAt < new Date()) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const userInResponse: SessionUserInResponse = await getSessionUserResponse(session.user);

    return NextResponse.json({ user: userInResponse }, { status: 200 });
}
