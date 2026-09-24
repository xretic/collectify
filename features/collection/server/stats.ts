import 'server-only';
import { db } from '@/shared/server/db';
import { getOwnedCollection } from '@/entities/collection/server/queries';
import type { CollectionStats } from '@/entities/collection/model/types';

const day = (date: Date) => date.toISOString().slice(0, 10);

/** Daily likes/comments/favorites (UTC days) for the collection owner. */
export async function getCollectionStats(
    collectionId: number,
    userId: number,
): Promise<CollectionStats> {
    await getOwnedCollection(collectionId, userId);

    const where = { collectionId };
    const select = { createdAt: true } as const;

    const [likes, comments, favorites] = await Promise.all([
        db.like.findMany({ where, select }),
        db.comment.findMany({ where, select }),
        db.favorite.findMany({ where, select }),
    ]);

    const counts = new Map<string, { likes: number; comments: number; favorites: number }>();
    const bump = (rows: { createdAt: Date }[], field: 'likes' | 'comments' | 'favorites') => {
        for (const row of rows) {
            const key = day(row.createdAt);
            const entry = counts.get(key) ?? { likes: 0, comments: 0, favorites: 0 };
            entry[field] += 1;
            counts.set(key, entry);
        }
    };

    bump(likes, 'likes');
    bump(comments, 'comments');
    bump(favorites, 'favorites');

    const days = [...counts.keys()].sort();

    return {
        days,
        likes: days.map((key) => counts.get(key)!.likes),
        comments: days.map((key) => counts.get(key)!.comments),
        favorites: days.map((key) => counts.get(key)!.favorites),
    };
}
