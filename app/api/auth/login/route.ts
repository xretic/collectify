import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { getSessionUserResponse } from '@/helpers/getSessionUserResponse';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Missing data.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        if (!user.passwordHash) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        const session = await prisma.session.create({
            data: {
                id: randomUUID(),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        const userInResponse: SessionUserInResponse = await getSessionUserResponse(user);

        const response = NextResponse.json({
            user: userInResponse,
        });

        response.cookies.set({
            name: 'sessionId',
            value: session.id,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
