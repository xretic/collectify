import 'server-only';
import { db } from '@/shared/server/db';

/**
 * Everything Collectify stores about a user, as one JSON document (GDPR
 * rights of access and portability). Other people's data is left out: of
 * conversations, only the messages the user wrote.
 */
export async function exportUserData(userId: number) {
    const [
        account,
        interests,
        collections,
        boards,
        likes,
        saved,
        following,
        comments,
        messages,
        reports,
        sanctions,
    ] = await Promise.all([
        db.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                emailVerifiedAt: true,
                username: true,
                fullName: true,
                description: true,
                avatarUrl: true,
                bannerUrl: true,
                country: true,
                city: true,
                birthDate: true,
                locale: true,
                theme: true,
                customThemes: true,
                createdAt: true,
                termsAcceptedAt: true,
                githubId: true,
                googleId: true,
                _count: { select: { followers: true } },
            },
        }),
        db.userInterest.findMany({
            where: { userId },
            select: { category: { select: { slug: true } }, createdAt: true },
        }),
        db.collection.findMany({
            where: { userId },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                bannerUrl: true,
                private: true,
                createdAt: true,
                category: { select: { slug: true } },
                tags: { select: { tag: { select: { name: true } } } },
                items: {
                    orderBy: { order: 'asc' },
                    select: {
                        title: true,
                        description: true,
                        imageUrl: true,
                        sourceUrl: true,
                        size: true,
                    },
                },
            },
        }),
        db.board.findMany({
            where: { userId },
            select: {
                name: true,
                createdAt: true,
                collections: { select: { collectionId: true } },
            },
        }),
        db.like.findMany({ where: { userId }, select: { collectionId: true, createdAt: true } }),
        db.favorite.findMany({
            where: { userId },
            select: { collectionId: true, createdAt: true },
        }),
        db.follow.findMany({
            where: { followerId: userId },
            select: { following: { select: { id: true, username: true } } },
        }),
        db.comment.findMany({
            where: { userId },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                collectionId: true,
                parentId: true,
                text: true,
                createdAt: true,
                editedAt: true,
            },
        }),
        db.message.findMany({
            where: { userId },
            orderBy: { id: 'asc' },
            select: { chatId: true, content: true, createdAt: true },
        }),
        db.report.findMany({
            where: { reporterId: userId },
            select: {
                targetType: true,
                reason: true,
                details: true,
                status: true,
                createdAt: true,
            },
        }),
        db.accountSanction.findMany({
            where: { userId },
            select: {
                scope: true,
                reason: true,
                expiresAt: true,
                revokedAt: true,
                createdAt: true,
            },
        }),
    ]);

    const { githubId, googleId, _count, ...profile } = account;

    return {
        exportedAt: new Date().toISOString(),
        account: {
            ...profile,
            birthDate: profile.birthDate?.toISOString().slice(0, 10) ?? null,
            signInWith: [githubId && 'github', googleId && 'google'].filter(Boolean),
            followers: _count.followers,
        },
        interests: interests.map((interest) => interest.category.slug),
        collections: collections.map(({ category, tags, ...collection }) => ({
            ...collection,
            category: category.slug,
            tags: tags.map(({ tag }) => tag.name),
        })),
        boards: boards.map(({ collections: entries, ...board }) => ({
            ...board,
            collectionIds: entries.map((entry) => entry.collectionId),
        })),
        likes,
        saved,
        following: following.map((follow) => follow.following),
        comments,
        messagesSent: messages,
        reportsMade: reports,
        sanctions,
    };
}
