import { NextResponse, NextRequest } from 'next/server';
import { isPasswordValid } from '@/helpers/isPasswordValid';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { generateUniqueUserId } from '@/helpers/generateUniqueUserId';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { getSessionUserResponse } from '@/helpers/getSessionUserResponse';

export async function POST(req: NextRequest) {
    try {
        const { email, password, username } = await req.json();

        if (!email || !password || !username || password.length < 8) {
            return NextResponse.json({ message: 'Invalid data.' }, { status: 400 });
        }

        if (!isPasswordValid(password)) {
            return NextResponse.json({ message: 'Invalid data.' }, { status: 405 });
        }

        const userExistence = await prisma.user.findFirst({
            where: { email },
        });

        if (userExistence) {
            return NextResponse.json({ message: 'This user already exists.' }, { status: 409 });
        }

        const usernameExistence = await prisma.user.findFirst({
            where: { username },
        });

        if (usernameExistence) {
            return NextResponse.json(
                { message: 'User with this username already exists.' },
                { status: 409 },
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const uniqueId = await generateUniqueUserId();

        const user = await prisma.user.create({
            data: {
                id: uniqueId,
                email,
                passwordHash,
                username: username,
                fullName: username,
            },
        });

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
            secure: true,
            maxAge: 60 * 60 * 24 * 30,
        });

        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
