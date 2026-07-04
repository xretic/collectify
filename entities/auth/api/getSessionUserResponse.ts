import { User } from '@/generated/prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { getActiveSanction } from '@/entities/management/api/server';
import { getUserRoles } from '@/entities/user/api/getUserRoles';

export async function getSessionUserResponse(
    user: User,
    session?: { impersonatorUserId?: number | null },
): Promise<SessionUserInResponse> {
    const [followersCount, subscriptionsCount, notificationsCount, unreadMessages] =
        await prisma.$transaction([
            prisma.follow.count({
                where: { followingId: user.id },
            }),
            prisma.follow.count({
                where: { followerId: user.id },
            }),
            prisma.notification.count({
                where: {
                    recipientUserId: user.id,
                    isRead: false,
                },
            }),
            prisma.message.count({
                where: {
                    recipientUserId: user.id,
                    read: false,
                },
            }),
        ]);

    const admin = await prisma.admin.findUnique({
        where: {
            userId: user.id,
        },
    });

    const [roles, commentsMute, messengerMute] = await Promise.all([
        getUserRoles(user.id),
        getActiveSanction(user.id, 'COMMENTS'),
        getActiveSanction(user.id, 'MESSENGER'),
    ]);

    const responseUser: SessionUserInResponse = {
        id: user.id,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        username: user.username,
        fullName: user.fullName,
        description: user.description,
        followers: followersCount,
        subscriptions: subscriptionsCount,
        notifications: notificationsCount,
        unreadMessages: unreadMessages,
        protected: user.passwordHash ? true : false,
        admin: !!admin,
        roles,
        impersonatorUserId: session?.impersonatorUserId ?? null,
        restrictions: {
            comments: {
                muted: !!commentsMute,
                expiresAt: commentsMute?.expiresAt?.toISOString() ?? null,
            },
            messenger: {
                muted: !!messengerMute,
                expiresAt: messengerMute?.expiresAt?.toISOString() ?? null,
            },
        },
    };

    return responseUser;
}
