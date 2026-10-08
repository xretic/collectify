import 'server-only';
import { db } from '@/shared/server/db';
import { getOwnedCollection } from '@/entities/collection/server/queries';
import type { CollectionStats } from '@/entities/collection/model/types';

type DayRow = { day: string; likes: number; comments: number; favorites: number };

/** Daily likes/comments/favorites (UTC days) for the collection owner, counted in the database. */
export async function getCollectionStats(
    collectionId: number,
    userId: number,
): Promise<CollectionStats> {
    await getOwnedCollection(collectionId, userId);

    // Timestamps are stored in UTC, so the date part is the UTC day.
    const rows = await db.$queryRaw<DayRow[]>`
        SELECT to_char(day, 'YYYY-MM-DD') AS day,
               SUM(likes)::int AS likes,
               SUM(comments)::int AS comments,
               SUM(favorites)::int AS favorites
        FROM (
            SELECT "createdAt"::date AS day, COUNT(*) AS likes, 0 AS comments, 0 AS favorites
            FROM "Like" WHERE "collectionId" = ${collectionId} GROUP BY 1
            UNION ALL
            SELECT "createdAt"::date, 0, COUNT(*), 0
            FROM "Comment" WHERE "collectionId" = ${collectionId} GROUP BY 1
            UNION ALL
            SELECT "createdAt"::date, 0, 0, COUNT(*)
            FROM "Favorite" WHERE "collectionId" = ${collectionId} GROUP BY 1
        ) counts
        GROUP BY day
        ORDER BY day
    `;

    return {
        days: rows.map((row) => row.day),
        likes: rows.map((row) => row.likes),
        comments: rows.map((row) => row.comments),
        favorites: rows.map((row) => row.favorites),
    };
}
