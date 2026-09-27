import 'server-only';
import { db } from '@/shared/server/db';
import { categoryRefSelect } from '@/entities/category/server/queries';
import { authorSelect } from './queries';

/** What a share image of a public collection shows; `null` for private or missing ones. */
export async function getCollectionPreview(collectionId: number) {
    return db.collection.findFirst({
        where: { id: collectionId, private: false },
        select: {
            name: true,
            bannerUrl: true,
            likeCount: true,
            category: { select: categoryRefSelect },
            user: { select: authorSelect },
            items: {
                where: { imageUrl: { not: null } },
                orderBy: { order: 'asc' },
                take: 8,
                select: { imageUrl: true },
            },
            _count: { select: { items: true } },
        },
    });
}
