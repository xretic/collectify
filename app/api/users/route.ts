import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function DELETE(req: NextRequest) {
    const hasBody = req.headers.get('content-type')?.includes('application/json');

    if (!hasBody) {
        return NextResponse.json({ status: 400 });
    }

    const data = await req.json();

    if (!data.password) {
        return NextResponse.json({ status: 400 });
    }

    const sessionId = req.cookies.get('sessionId')?.value;
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    if (session?.user.passwordHash) {
        const passwordMatch = await bcrypt.compare(data.password, session.user.passwordHash);

        if (!passwordMatch) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }
    }

    await prisma.user.delete({
        where: {
            id: session!.userId,
        },
    });

    const res = NextResponse.json({ status: 200 });

    res.cookies.delete('sessionId');

    return res;
}
