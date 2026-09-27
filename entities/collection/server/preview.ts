import 'server-only';
import { cache } from 'react';
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

/** Title, description and article tags of a public collection's page (`null` otherwise). */
export const getCollectionMeta = cache((collectionId: number) =>
    db.collection.findFirst({
        where: { id: collectionId, private: false },
        select: {
            name: true,
            description: true,
            createdAt: true,
            category: { select: categoryRefSelect },
            user: { select: { id: true, fullName: true, username: true } },
            tags: { select: { tag: { select: { name: true } } }, take: 10 },
            _count: { select: { items: true } },
        },
    }),
);
