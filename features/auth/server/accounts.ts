import 'server-only';
import bcrypt from 'bcrypt';
import { db, isUniqueViolation } from '@/shared/server/db';
import { badRequest, conflict, forbidden, unauthorized } from '@/shared/server/http';
import { getActiveSanction, sanctionMessage } from '@/entities/sanction/server/sanctions';
import { generateUserId } from '@/entities/user/server/generateUserId';
import { writeAudit } from '@/entities/moderation/server/audit';
import type { AuthSession } from '@/entities/session/server/session';

const BCRYPT_COST = 12;
// Compared against when the email is unknown, so response time does not reveal
// whether an account exists.
const DUMMY_HASH = '$2b$12$EDSJTBiJRXOpprXhHxa.C.tMcycZBRpdlVL7d8f33SWUXRp2rrfvK';

export async function assertNotBanned(userId: number) {
    const ban = await getActiveSanction(userId, 'ACCOUNT');
    if (ban) throw forbidden(sanctionMessage('Your account is banned.', ban.expiresAt));
}

export async function verifyCredentials(email: string, password: string) {
    const user = await db.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, passwordHash: true },
    });

    const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user?.passwordHash || !matches) throw unauthorized('Invalid email or password.');

    await assertNotBanned(user.id);

    return user.id;
}

export async function registerUser(input: { email: string; username: string; password: string }) {
    const existing = await db.user.findFirst({
        where: {
            OR: [
                { email: { equals: input.email, mode: 'insensitive' } },
                { username: input.username },
            ],
        },
        select: { email: true },
    });

    if (existing) {
        throw conflict(
            existing.email.toLowerCase() === input.email
                ? 'An account with this email already exists.'
                : 'This username is taken.',
        );
    }

    try {
        const user = await db.user.create({
            data: {
                id: await generateUserId(),
                email: input.email,
                username: input.username,
                fullName: input.username,
                passwordHash: await bcrypt.hash(input.password, BCRYPT_COST),
            },
            select: { id: true },
        });

        return user.id;
    } catch (error) {
        if (isUniqueViolation(error)) throw conflict('This email or username is already taken.');
        throw error;
    }
}

export async function changePassword(
    userId: number,
    input: { currentPassword?: string; newPassword: string },
) {
    const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { passwordHash: true },
    });

    if (user.passwordHash) {
        if (!input.currentPassword) throw badRequest('Current password is required.');

        const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!matches) throw unauthorized('Current password is incorrect.');

        if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
            throw badRequest('New password must be different from the current one.');
        }
    }

    await db.user.update({
        where: { id: userId },
        data: { passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_COST) },
    });
}

export async function deleteOwnAccount(userId: number, confirmation: string) {
    const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { passwordHash: true, username: true },
    });

    const confirmed = user.passwordHash
        ? await bcrypt.compare(confirmation, user.passwordHash)
        : confirmation.trim().toLowerCase() === user.username;

    if (!confirmed) {
        throw unauthorized(
            user.passwordHash ? 'Password is incorrect.' : 'Type your username to confirm.',
        );
    }

    await db.$transaction([
        db.chat.deleteMany({ where: { users: { some: { id: userId } } } }),
        db.user.delete({ where: { id: userId } }),
    ]);
}

export async function stopImpersonation(session: AuthSession) {
    if (!session.impersonatorUserId) throw badRequest('Impersonation is not active.');

    const adminId = session.impersonatorUserId;

    await db.$transaction(async (tx) => {
        await tx.session.update({
            where: { id: session.id },
            data: { userId: adminId, impersonatorUserId: null },
        });

        await writeAudit(
            { userId: adminId, impersonatorId: null },
            { action: 'stop-impersonation', targetUserId: session.userId },
            tx,
        );
    });

    return adminId;
}
