import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
        await prisma.session.delete({ where: { id: sessionId } });
        const res = NextResponse.json({ ok: true });

        res.cookies.delete('sessionId');

        return res;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
