import { NextResponse, NextRequest } from 'next/server';
import { isPasswordValid } from '@/shared/lib/validation/isPasswordValid';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { prisma } from '@/shared/lib/prisma';
import { generateUniqueUserId } from '@/shared/lib/generateUniqueUserId';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { getSessionUserResponse } from '@/entities/auth/api/getSessionUserResponse';
import { SESSION_AGE_IN_DAYS } from '@/shared/lib/constants';
import { rateLimit } from '@/shared/api/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const limited = await rateLimit(req, 'auth');
        if (limited) return limited;

        const { email, password, username } = await req.json();

        if (!email || !password || !username) {
            return NextResponse.json({ message: 'Invalid data.' }, { status: 400 });
        }

        if (!isPasswordValid(password)) {
            return NextResponse.json({ message: 'Invalid data.' }, { status: 405 });
        }

        const userExistence = await prisma.user.findUnique({
            where: { email },
        });

        if (userExistence) {
            return NextResponse.json({ message: 'This user already exists.' }, { status: 409 });
        }

        const usernameExistence = await prisma.user.findUnique({
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
                username: username.toLowerCase(),
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
            maxAge: 60 * 60 * 24 * SESSION_AGE_IN_DAYS,
        });

        return response;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
