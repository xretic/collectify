import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const sessionId = req.cookies.get('sessionId')?.value;

    if (!sessionId) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    if (sessionId) {
        await prisma.session.delete({ where: { id: sessionId } });
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.delete('sessionId');

    return res;
}
