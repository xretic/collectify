import 'server-only';
import { db } from '@/shared/server/db';
import { withCache } from '@/shared/server/cache';
import type { CollectionCard } from '../model/types';
import { COLLECTIONS_CACHE_NAMESPACE, findCardsByIds } from './queries';

const RELATED_LIMIT = 12;
/** Candidates read per signal (shared tags, same category), each from an index. */
const CANDIDATES = 300;
const RELATED_TTL_SECONDS = 600;

/*
 * "More like this" under a collection. Score:
 *   3 per shared tag · +2 same category · 0.6 × ln(1 + likes) · −1 same author
 * One per name, so a row of identically named collections cannot fill the list.
 */
function rankRelated(collectionId: number) {
    return db.$queryRaw<{ id: number }[]>`
        WITH target AS (
            SELECT "id", "categoryId", "userId", "lowerCaseName"
            FROM "Collection" WHERE "id" = ${collectionId}
        ),
        by_tags AS (
            SELECT ct."collectionId" AS id, COUNT(*)::int AS shared
            FROM "CollectionTag" ct
            WHERE ct."tagId" IN (
                SELECT "tagId" FROM "CollectionTag" WHERE "collectionId" = ${collectionId}
            )
              AND ct."collectionId" <> ${collectionId}
            GROUP BY ct."collectionId"
            ORDER BY shared DESC
            LIMIT ${CANDIDATES}
        ),
        by_category AS (
            SELECT c."id" FROM "Collection" c, target t
            WHERE c."private" = FALSE AND c."categoryId" = t."categoryId" AND c."id" <> t."id"
            ORDER BY c."likeCount" DESC
            LIMIT ${CANDIDATES}
        ),
        scored AS (
            SELECT DISTINCT ON (c."lowerCaseName")
                c."id",
                COALESCE(bt.shared, 0) * 3
                    + CASE WHEN c."categoryId" = t."categoryId" THEN 2 ELSE 0 END
                    + 0.6 * LN(1 + c."likeCount")
                    - CASE WHEN c."userId" = t."userId" THEN 1 ELSE 0 END AS score
            FROM (SELECT id FROM by_tags UNION SELECT id FROM by_category) k
            JOIN "Collection" c ON c."id" = k.id
            CROSS JOIN target t
            LEFT JOIN by_tags bt ON bt.id = c."id"
            WHERE c."private" = FALSE AND c."lowerCaseName" <> t."lowerCaseName"
            ORDER BY c."lowerCaseName", score DESC
        )
        SELECT "id" FROM scored ORDER BY score DESC, "id" DESC LIMIT ${RELATED_LIMIT}
    `;
}

/** Public collections similar to `collectionId` (its tags and category), with fresh counters. */
export async function listRelatedCollections(collectionId: number): Promise<CollectionCard[]> {
    const ids = await withCache(
        COLLECTIONS_CACHE_NAMESPACE,
        `related:${collectionId}`,
        RELATED_TTL_SECONDS,
        async () => (await rankRelated(collectionId)).map((row) => row.id),
    );

    const cards = await findCardsByIds(ids);
    return cards.filter((card) => !card.isPrivate);
}
