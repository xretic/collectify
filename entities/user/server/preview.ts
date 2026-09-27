import 'server-only';
import { db } from '@/shared/server/db';

/** What a share image of a profile shows: identity, counters and recent public covers. */
export async function getProfilePreview(userId: number) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            fullName: true,
            username: true,
            avatarUrl: true,
            _count: { select: { followers: true } },
        },
    });
    if (!user) return null;

    const where = { userId, private: false };
    const [collections, recent] = await Promise.all([
        db.collection.count({ where }),
        db.collection.findMany({
            where,
            orderBy: { likeCount: 'desc' },
            take: 8,
            select: { bannerUrl: true },
        }),
    ]);

    return {
        ...user,
        followers: user._count.followers,
        collections,
        covers: recent.map((collection) => collection.bannerUrl),
    };
}
