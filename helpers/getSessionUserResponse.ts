import { User } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { getUserRoles } from './getUserRoles';

export async function getSessionUserResponse(user: User): Promise<SessionUserInResponse> {
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

    const roles = await getUserRoles(user.id);

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
    };

    return responseUser;
}
