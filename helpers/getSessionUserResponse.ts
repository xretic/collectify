import { User } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';

export async function getSessionUserResponse(user: User): Promise<SessionUserInResponse> {
    const [followersCount, subscriptionsCount, notificationsCount] = await prisma.$transaction([
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
        protected: user.passwordHash ? true : false,
    };

    return responseUser;
}
