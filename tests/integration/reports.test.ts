import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/server/http';
import {
    createCommentBy,
    createUser,
    getDb,
    hasTestDatabase,
    resetDatabase,
    staffContext,
} from '../support/db';

const createReport = async (
    ...args: Parameters<typeof import('@/features/report/create/server/createReport').createReport>
) => (await import('@/features/report/create/server/createReport')).createReport(...args);

const reviewReport = async (
    ...args: Parameters<typeof import('@/features/report/review/server/reviewReport').reviewReport>
) => (await import('@/features/report/review/server/reviewReport')).reviewReport(...args);

const noPunishment = {
    resolution: '',
    removeContent: false,
    punishment: null,
    duplicateOfId: null,
};

async function expectApiError(promise: Promise<unknown>, status: number) {
    await expect(promise).rejects.toSatisfy(
        (error) => error instanceof ApiError && error.status === status,
    );
}

describe.skipIf(!hasTestDatabase)('reports', () => {
    beforeEach(resetDatabase);

    describe('createReport', () => {
        it('stores a snapshot and rejects duplicates from the same reporter', async () => {
            const db = await getDb();
            const [author, reporter] = [await createUser(), await createUser()];
            const comment = await createCommentBy(author, 'you are awful');

            await createReport(reporter, {
                target: { type: 'COMMENT', commentId: comment.id },
                reason: 'HARASSMENT',
                details: '',
            });

            const report = await db.report.findFirstOrThrow();
            expect(report.targetUserId).toBe(author);
            expect(report.contentSnapshot).toMatchObject({ text: 'you are awful' });

            await expectApiError(
                createReport(reporter, {
                    target: { type: 'COMMENT', commentId: comment.id },
                    reason: 'SPAM',
                    details: '',
                }),
                409,
            );
        });

        it('refuses to report yourself or an admin', async () => {
            const [user, admin] = [await createUser(), await createUser('Admin')];

            await expectApiError(
                createReport(user, {
                    target: { type: 'USER', userId: user },
                    reason: 'SPAM',
                    details: '',
                }),
                403,
            );
            await expectApiError(
                createReport(user, {
                    target: { type: 'USER', userId: admin },
                    reason: 'SPAM',
                    details: '',
                }),
                403,
            );
        });
    });

    describe('reviewReport', () => {
        it('lets only one of two concurrent reviewers close a report', async () => {
            const db = await getDb();
            const [target, reporter] = [await createUser(), await createUser()];
            const [modA, modB] = [await createUser('Moderator'), await createUser('Moderator')];

            await createReport(reporter, {
                target: { type: 'USER', userId: target },
                reason: 'SPAM',
                details: '',
            });
            const report = await db.report.findFirstOrThrow();

            const payload = {
                ...noPunishment,
                verdict: 'GUILTY' as const,
                punishment: { scope: 'COMMENTS' as const, duration: '1d' as const },
            };
            const results = await Promise.allSettled([
                reviewReport(await staffContext(modA), report.id, payload),
                reviewReport(await staffContext(modB), report.id, payload),
            ]);

            expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
            expect(await db.accountSanction.count()).toBe(1);
        });

        it('never weakens a stronger sanction', async () => {
            const db = await getDb();
            const [target, reporter, admin, moderator] = [
                await createUser(),
                await createUser(),
                await createUser('Admin'),
                await createUser('Moderator'),
            ];

            await db.accountSanction.create({
                data: {
                    userId: target,
                    moderatorId: admin,
                    scope: 'COMMENTS',
                    expiresAt: null,
                    reason: 'permanent',
                },
            });

            await createReport(reporter, {
                target: { type: 'USER', userId: target },
                reason: 'SPAM',
                details: '',
            });
            const report = await db.report.findFirstOrThrow();

            const result = await reviewReport(await staffContext(moderator), report.id, {
                ...noPunishment,
                verdict: 'GUILTY',
                punishment: { scope: 'COMMENTS', duration: '1h' },
            });

            expect(result.sanctionApplied).toBe(false);

            const active = await db.accountSanction.findMany({
                where: { userId: target, revokedAt: null },
            });
            expect(active).toHaveLength(1);
            expect(active[0].expiresAt).toBeNull();
        });

        it('removes content, keeps the evidence and closes other reports about it', async () => {
            const db = await getDb();
            const [author, reporterA, reporterB, moderator] = [
                await createUser(),
                await createUser(),
                await createUser(),
                await createUser('Moderator'),
            ];
            const comment = await createCommentBy(author, 'spam spam');

            for (const reporter of [reporterA, reporterB]) {
                await createReport(reporter, {
                    target: { type: 'COMMENT', commentId: comment.id },
                    reason: 'SPAM',
                    details: '',
                });
            }

            const [first] = await db.report.findMany({ orderBy: { id: 'asc' } });

            await reviewReport(await staffContext(moderator), first.id, {
                ...noPunishment,
                verdict: 'GUILTY',
                removeContent: true,
            });

            expect(await db.comment.count({ where: { id: comment.id } })).toBe(0);

            const reports = await db.report.findMany({ orderBy: { id: 'asc' } });
            expect(
                reports.every((report) => report.status === 'CLOSED' && report.openKey === null),
            ).toBe(true);
            expect(reports[1].duplicateOfId).toBe(first.id);
            expect(reports[0].contentSnapshot).toMatchObject({ text: 'spam spam' });

            const notified = await db.notification.count({ where: { type: 'REPORT_RESOLVED' } });
            expect(notified).toBe(1);
        });

        it('forbids reviewing your own report and moderating other moderators', async () => {
            const db = await getDb();
            const [modA, modB, user] = [
                await createUser('Moderator'),
                await createUser('Moderator'),
                await createUser(),
            ];

            await createReport(modA, {
                target: { type: 'USER', userId: user },
                reason: 'SPAM',
                details: '',
            });
            await createReport(user, {
                target: { type: 'USER', userId: modB },
                reason: 'SPAM',
                details: '',
            });
            const [own, aboutModerator] = await db.report.findMany({ orderBy: { id: 'asc' } });

            await expectApiError(
                reviewReport(await staffContext(modA), own.id, {
                    ...noPunishment,
                    verdict: 'NO_VIOLATION',
                }),
                403,
            );
            await expectApiError(
                reviewReport(await staffContext(modA), aboutModerator.id, {
                    ...noPunishment,
                    verdict: 'NO_VIOLATION',
                }),
                403,
            );
        });

        it('only admins issue permanent sanctions', async () => {
            const db = await getDb();
            const [target, reporter, moderator] = [
                await createUser(),
                await createUser(),
                await createUser('Moderator'),
            ];

            await createReport(reporter, {
                target: { type: 'USER', userId: target },
                reason: 'SPAM',
                details: '',
            });
            const report = await db.report.findFirstOrThrow();

            await expectApiError(
                reviewReport(await staffContext(moderator), report.id, {
                    ...noPunishment,
                    verdict: 'GUILTY',
                    punishment: { scope: 'ACCOUNT', duration: 'permanent' },
                }),
                403,
            );

            expect((await db.report.findFirstOrThrow()).status).toBe('OPEN');
        });
    });
});
