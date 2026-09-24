import 'server-only';
import { db, isUniqueViolation } from '@/shared/server/db';
import { badRequest, conflict, forbidden, notFound } from '@/shared/server/http';
import { notifySocial, retractSocial } from '@/entities/notification/server/notifications';

export async function updateProfile(
    userId: number,
    input: {
        username?: string;
        fullName?: string;
        description?: string;
        avatarUrl?: string;
        bannerUrl?: string;
    },
) {
    if (Object.keys(input).length === 0) throw badRequest('Nothing to update.');

    try {
        await db.user.update({ where: { id: userId }, data: input, select: { id: true } });
    } catch (error) {
        if (isUniqueViolation(error)) throw conflict('This username is taken.');
        throw error;
    }
}

export async function follow(followerId: number, followingId: number) {
    if (followerId === followingId) throw forbidden('You cannot follow yourself.');

    const target = await db.user.findUnique({ where: { id: followingId }, select: { id: true } });
    if (!target) throw notFound('User not found.');

    await db.follow.upsert({
        where: { followerId_followingId: { followerId, followingId } },
        update: {},
        create: { followerId, followingId },
    });

    await notifySocial({ type: 'FOLLOW', senderUserId: followerId, recipientUserId: followingId });
}

export async function unfollow(followerId: number, followingId: number) {
    await db.follow.deleteMany({ where: { followerId, followingId } });
    await retractSocial({ type: 'FOLLOW', senderUserId: followerId, recipientUserId: followingId });
}
