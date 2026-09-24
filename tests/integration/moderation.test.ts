import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/server/http';
import { createUser, getDb, hasTestDatabase, resetDatabase, staffContext } from '../support/db';

const moderation = () => import('@/features/moderation/server/moderation');

async function expectApiError(promise: Promise<unknown>, status: number) {
    await expect(promise).rejects.toSatisfy(
        (error) => error instanceof ApiError && error.status === status,
    );
}

describe.skipIf(!hasTestDatabase)('moderation', () => {
    beforeEach(resetDatabase);

    it('account bans log the user out', async () => {
        const db = await getDb();
        const { issueManualSanction } = await moderation();
        const [admin, user] = [await createUser('Admin'), await createUser()];

        await db.session.create({
            data: { id: 'victim-session', userId: user, expiresAt: new Date(Date.now() + 1e6) },
        });
        await issueManualSanction(await staffContext(admin), user, {
            scope: 'ACCOUNT',
            duration: '1d',
            reason: '',
        });

        expect(await db.session.count({ where: { userId: user } })).toBe(0);
        expect(await db.moderationAction.count({ where: { action: 'sanction:ACCOUNT' } })).toBe(1);
    });

    it('moderators cannot lift sanctions issued by an admin', async () => {
        const db = await getDb();
        const { revokeSanction } = await moderation();
        const [admin, moderator, user] = [
            await createUser('Admin'),
            await createUser('Moderator'),
            await createUser(),
        ];

        const sanction = await db.accountSanction.create({
            data: {
                userId: user,
                moderatorId: admin,
                scope: 'MESSENGER',
                expiresAt: new Date(Date.now() + 1e7),
            },
        });

        await expectApiError(revokeSanction(await staffContext(moderator), sanction.id), 403);
        await revokeSanction(await staffContext(admin), sanction.id);

        expect(
            (await db.accountSanction.findUniqueOrThrow({ where: { id: sanction.id } })).revokedAt,
        ).not.toBeNull();
    });

    it('only admins manage moderators and nobody manages admins', async () => {
        const { setUserRole } = await moderation();
        const [admin, otherAdmin, moderator, user] = [
            await createUser('Admin'),
            await createUser('Admin'),
            await createUser('Moderator'),
            await createUser(),
        ];

        await expectApiError(
            setUserRole(await staffContext(moderator), user, {
                role: 'Moderator',
                enabled: true,
                reason: '',
            }),
            403,
        );
        await expectApiError(
            setUserRole(await staffContext(admin), otherAdmin, {
                role: 'Verified',
                enabled: true,
                reason: '',
            }),
            403,
        );

        await setUserRole(await staffContext(admin), user, {
            role: 'Moderator',
            enabled: true,
            reason: '',
        });
        expect(await (await getDb()).moderator.count({ where: { userId: user } })).toBe(1);
    });

    it('deleting a user removes their chats and keeps no email in the audit log', async () => {
        const db = await getDb();
        const { deleteUserAccount } = await moderation();
        const [admin, user, friend] = [
            await createUser('Admin'),
            await createUser(),
            await createUser(),
        ];

        await db.chat.create({
            data: {
                pairKey: `${user}:${friend}`,
                users: { connect: [{ id: user }, { id: friend }] },
            },
        });
        await deleteUserAccount(await staffContext(admin), user);

        expect(await db.chat.count()).toBe(0);
        const audit = await db.moderationAction.findFirstOrThrow({
            where: { action: 'delete-user' },
        });
        expect(JSON.stringify(audit.metadata)).not.toContain('@test.local');
    });
});
