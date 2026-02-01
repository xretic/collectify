import { isPasswordValid } from '@/helpers/isPasswordValid';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { getSessionUserResponse } from '@/helpers/getSessionUserResponse';

export async function PATCH(req: NextRequest) {
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

        const sessionUser = session.user;

        const hasBody = req.headers.get('content-type')?.includes('application/json');

        if (!hasBody) {
            return NextResponse.json({ message: 'Request body missing.' }, { status: 400 });
        }

        const { currentPassword, newPassword, confirmPassword } = await req.json();

        if (!newPassword || !confirmPassword) {
            return NextResponse.json(
                { message: 'New password and confirmation are required.' },
                { status: 400 },
            );
        }

        if (!currentPassword && sessionUser.passwordHash) {
            return NextResponse.json({ message: 'Current password is required.' }, { status: 400 });
        }

        if (!isPasswordValid(newPassword) || !isPasswordValid(confirmPassword)) {
            return NextResponse.json(
                { message: 'Password does not meet requirements.' },
                { status: 400 },
            );
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ message: 'Passwords do not match.' }, { status: 400 });
        }

        if (sessionUser.passwordHash) {
            const passwordMatch = await bcrypt.compare(
                currentPassword,
                sessionUser.passwordHash ?? '',
            );

            if (!passwordMatch) {
                return NextResponse.json({ message: 'Invalid password.' }, { status: 401 });
            }
        }

        const samePassword = await bcrypt.compare(newPassword, sessionUser.passwordHash ?? '');

        if (samePassword) {
            return NextResponse.json(
                { message: 'New password must be different from the current password.' },
                { status: 400 },
            );
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        const updatedUser = await prisma.user.update({
            where: {
                id: sessionUser.id,
            },
            data: {
                passwordHash,
            },
        });

        const userInResponse: SessionUserInResponse = await getSessionUserResponse(updatedUser);

        return NextResponse.json(
            {
                message: `Session user password updated.`,
                user: userInResponse,
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
