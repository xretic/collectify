import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;

        if (!sessionId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const data = await req.json();
        const key = data.secret;

        if (!key.trim()) {
            return NextResponse.json({ message: 'Secret key is required.' }, { status: 401 });
        }

        if (key !== process.env.ASSIGN_SECRET) {
            return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
        }

        await prisma.admin.upsert({
            where: {
                userId: session.userId,
            },

            update: {},

            create: {
                userId: session.userId,
            },
        });

        return NextResponse.json(
            { message: 'The session user has been assigned the administrator role.' },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
