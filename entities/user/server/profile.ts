import 'server-only';
import { db } from '@/shared/server/db';
import { getActiveSanctions } from '@/entities/sanction/server/sanctions';
import type { PublicUser, SessionUser, UserRestriction } from '../model/types';
import { roleSelect, toRoles } from './roles';

function toRestriction(expiresAt: Date | null | undefined): UserRestriction {
    return expiresAt === undefined
        ? { muted: false, expiresAt: null }
        : { muted: true, expiresAt: expiresAt?.toISOString() ?? null };
}

export async function getSessionUser(
    userId: number,
    impersonatorUserId: number | null,
): Promise<SessionUser | null> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            avatarUrl: true,
            bannerUrl: true,
            username: true,
            fullName: true,
            description: true,
            country: true,
            city: true,
            birthDate: true,
            feedTabOrder: true,
            passwordHash: true,
            ...roleSelect,
            _count: {
                select: {
                    followers: true,
                    subscriptions: true,
                    notifications: { where: { isRead: false } },
                    receivedMessages: { where: { read: false } },
                },
            },
        },
    });

    if (!user) return null;

    const sanctions = await getActiveSanctions([userId]);
    const muteExpiry = (scope: 'COMMENTS' | 'MESSENGER') =>
        sanctions.find((sanction) => sanction.scope === scope)?.expiresAt;

    return {
        id: user.id,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        username: user.username,
        fullName: user.fullName,
        description: user.description,
        country: user.country,
        city: user.city,
        birthDate: user.birthDate?.toISOString().slice(0, 10) ?? null,
        feedTabOrder: user.feedTabOrder,
        followers: user._count.followers,
        subscriptions: user._count.subscriptions,
        notifications: user._count.notifications,
        unreadMessages: user._count.receivedMessages,
        hasPassword: user.passwordHash !== null,
        roles: toRoles(user),
        impersonatorUserId,
        restrictions: {
            comments: toRestriction(muteExpiry('COMMENTS')),
            messenger: toRestriction(muteExpiry('MESSENGER')),
        },
    };
}

export async function getPublicUser(
    userId: number,
    viewerId: number | null,
): Promise<PublicUser | null> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            avatarUrl: true,
            bannerUrl: true,
            username: true,
            fullName: true,
            description: true,
            country: true,
            city: true,
            ...roleSelect,
            _count: { select: { followers: true, subscriptions: true } },
            followers: viewerId
                ? { where: { followerId: viewerId }, select: { followerId: true } }
                : false,
        },
    });

    if (!user) return null;

    return {
        id: user.id,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        username: user.username,
        fullName: user.fullName,
        description: user.description,
        country: user.country,
        city: user.city,
        followers: user._count.followers,
        subscriptions: user._count.subscriptions,
        isFollowed: Array.isArray(user.followers) && user.followers.length > 0,
        roles: toRoles(user),
    };
}
