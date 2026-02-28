import { getSessionUserResponse } from '@/helpers/getSessionUserResponse';
import { prisma } from '@/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                user: true,
            },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const userInResponse: SessionUserInResponse = await getSessionUserResponse(session!.user);

        return NextResponse.json({ user: userInResponse }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
