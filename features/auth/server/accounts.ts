import 'server-only';
import bcrypt from 'bcrypt';
import { db, isUniqueViolation } from '@/shared/server/db';
import type { Locale } from '@/shared/config/i18n';
import { badRequest, conflict, unauthorized } from '@/shared/server/http';
import { getActiveSanction, sanctionError } from '@/entities/sanction/server/sanctions';
import { generateUserId } from '@/entities/user/server/generateUserId';
import { writeAudit } from '@/entities/moderation/server/audit';
import type { AuthSession } from '@/entities/session/server/session';
import { consumeToken } from './emailLinks';
import { prepareUploadCleanup } from '@/entities/user/server/uploads';
import { dropRevokedConnections } from '@/shared/server/realtime';
import { refreshCollectionImages, refreshProfileImage } from '@/shared/server/shareImages';

const BCRYPT_COST = 12;
// Compared against when the email is unknown, so response time does not reveal
// whether an account exists.
const DUMMY_HASH = '$2b$12$EDSJTBiJRXOpprXhHxa.C.tMcycZBRpdlVL7d8f33SWUXRp2rrfvK';

/** 401 unless `password` is the account's password (an account without one cannot pass). */
export async function assertPassword(userId: number, password: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
    });
    const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user?.passwordHash || !matches) throw unauthorized('passwordIncorrect');
}

export async function assertNotBanned(userId: number) {
    const ban = await getActiveSanction(userId, 'ACCOUNT');
    if (ban) throw sanctionError('ACCOUNT', ban.expiresAt);
}

/**
 * The account of a correct email + password. Whether its address must be
 * confirmed first is up to the caller (`needsEmailConfirmation`).
 */
export async function verifyCredentials(email: string, password: string) {
    const user = await db.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, email: true, passwordHash: true, emailVerifiedAt: true },
    });

    const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user?.passwordHash || !matches) throw unauthorized('invalidCredentials');

    await assertNotBanned(user.id);

    return { userId: user.id, email: user.email, emailVerifiedAt: user.emailVerifiedAt };
}

export type RegisterInput = {
    email: string;
    username: string;
    password: string;
    locale: Locale;
};

/**
 * Checks a sign-up without creating anything: a taken username is a 409 (it
 * says nothing about the email, usernames are public anyway). Returns the
 * password hash and the id of the account that already uses the address, if
 * any. Hashing happens either way, so both cases take the same time.
 */
export async function checkRegistration(input: RegisterInput) {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

    const [usernameOwner, emailOwner] = await Promise.all([
        db.user.findUnique({ where: { username: input.username }, select: { id: true } }),
        findEmailOwner(input.email),
    ]);
    if (usernameOwner) throw conflict('usernameTaken');

    return { passwordHash, existingUserId: emailOwner?.id ?? null };
}

/** The account that uses this address, if any (case-insensitive). */
export function findEmailOwner(email: string) {
    return db.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
    });
}

/**
 * Creates the account checked by `checkRegistration`. `null` when someone took
 * the address or the username in the meantime.
 */
export async function createAccount(
    input: RegisterInput,
    passwordHash: string,
): Promise<number | null> {
    try {
        const user = await db.user.create({
            data: {
                id: await generateUserId(),
                email: input.email,
                username: input.username,
                fullName: input.username,
                passwordHash,
                locale: input.locale,
                termsAcceptedAt: new Date(),
            },
            select: { id: true },
        });

        return user.id;
    } catch (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
    }
}

/**
 * Sets a new password and signs the account out everywhere except
 * `keepSessionId` (the device the change was made on), so a stolen session
 * does not survive it.
 */
export async function changePassword(
    userId: number,
    keepSessionId: string,
    input: { currentPassword?: string; newPassword: string },
) {
    const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { passwordHash: true },
    });

    if (user.passwordHash) {
        if (!input.currentPassword) throw badRequest('currentPasswordRequired');

        const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!matches) throw unauthorized('currentPasswordIncorrect');

        if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
            throw badRequest('passwordUnchanged');
        }
    }

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);

    await db.$transaction([
        db.user.update({ where: { id: userId }, data: { passwordHash } }),
        db.session.deleteMany({ where: { userId, id: { not: keepSessionId } } }),
        db.emailToken.deleteMany({ where: { userId, kind: 'PASSWORD_RESET' } }),
    ]);
    await dropRevokedConnections([userId]);
}

/**
 * Sets a new password from a reset link and signs the account out everywhere.
 * Opening the link also proves the address belongs to the user.
 */
export async function resetPassword(token: string, password: string) {
    const userId = await consumeToken(token, 'PASSWORD_RESET');
    await assertNotBanned(userId);

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    await db.$transaction([
        db.user.update({ where: { id: userId }, data: { passwordHash } }),
        db.user.updateMany({
            where: { id: userId, emailVerifiedAt: null },
            data: { emailVerifiedAt: new Date() },
        }),
        db.session.deleteMany({ where: { userId } }),
        db.emailToken.deleteMany({ where: { userId, kind: 'PASSWORD_RESET' } }),
    ]);
    await dropRevokedConnections([userId]);

    return userId;
}

/**
 * Deletes the account and everything it owns. Returns a cleanup that erases
 * its uploaded images from the media host (run after the response; without
 * the Uploadcare secret key it does nothing).
 */
export async function deleteOwnAccount(userId: number, confirmation: string) {
    const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { passwordHash: true, username: true },
    });

    const confirmed = user.passwordHash
        ? await bcrypt.compare(confirmation, user.passwordHash)
        : confirmation.trim().toLowerCase() === user.username;

    if (!confirmed) {
        throw unauthorized(user.passwordHash ? 'passwordIncorrect' : 'typeUsernameToConfirm');
    }

    const cleanupUploads = await prepareUploadCleanup(userId);
    const collections = await db.collection.findMany({ where: { userId }, select: { id: true } });

    await db.$transaction([
        db.chat.deleteMany({ where: { users: { some: { id: userId } } } }),
        db.user.delete({ where: { id: userId } }),
    ]);
    await dropRevokedConnections([userId]);
    refreshCollectionImages(collections.map((collection) => collection.id));
    refreshProfileImage(userId);

    return cleanupUploads;
}

export async function stopImpersonation(session: AuthSession) {
    if (!session.impersonatorUserId) throw badRequest('impersonationInactive');

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
