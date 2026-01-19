import { NextResponse, NextRequest } from 'next/server';
import isPasswordValid from '@/helpers/isPasswordValid';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { generateRandomId } from '@/helpers/generateRandomId';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password || password.length < 8) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        if (!isPasswordValid(password)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 405 });
        }

        const userExistence = await prisma.user.findFirst({
            where: { email },
        });

        if (userExistence) {
            return NextResponse.json({ error: 'This user already exists!' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const name = email.split('@')[0];
        const uniqueId = await generateRandomId();

        const user = await prisma.user.create({
            data: {
                id: uniqueId,
                email,
                passwordHash,
                username: name,
                fullName: name,
            },
        });

        const session = await prisma.session.create({
            data: {
                id: randomUUID(),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        const response = NextResponse.json({
            user: {
                id: user.id,
                avatarUrl: user.avatarUrl,
                bannerUrl: user.bannerUrl,
                username: user.username,
                fullName: user.fullName,
                description: user.description,
            },
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
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
