import 'server-only';
import { db } from '@/shared/server/db';
import { withCache } from '@/shared/server/cache';
import { PAGE_SIZE } from '@/shared/lib/constants';
import type { CollectionListPage } from '../model/types';
import { findCardsByIds } from './queries';

/*
 * Content-based ranking done in SQL (timestamps are stored as UTC without a
 * time zone, hence `NOW() AT TIME ZONE 'UTC'`). Every candidate is a public
 * collection that is not the viewer's own and that the viewer has never liked
 * or favorited (even if they took it back since). Weights:
 *
 *   interest signals  like 3 · save 4 · view 1 per visit (max 3) · own collection 2
 *   tag match         Σ min(weight of the tag in the viewer's signals, 10)
 *   category match    0.3 × category weight (+5 for categories picked at sign-up)
 *   social            +6 when the author is followed
 *   popularity        1.5 × ln(1 + likes)   (denormalized "likeCount")
 *   freshness         3 / (1 + age in days / 14)
 *   already viewed    −4 (still shown, just later)
 *
 * Only the latest `SIGNALS_PER_KIND` signals of each kind are read, and
 * only a bounded candidate set is scored, each part served by an index: the
 * newest collections of the viewer's top tags, top categories and followed
 * authors, plus the newest collections overall. The ranked ids (at most
 * `POOL_SIZE`) are cached per viewer for `POOL_TTL_SECONDS`; pages are cut
 * from that pool and re-checked against fresh likes/favorites.
 */

export const RECOMMENDATIONS_CACHE_NAMESPACE = 'recommendations';

/** Ranked collections kept per feed: 10 pages. */
const POOL_SIZE = PAGE_SIZE * 10;
const POOL_TTL_SECONDS = 120;
/** Candidate limits (per preferred tag, per category, per followed author, overall). */
const PER_TAG = 100;
const TOP_TAGS = 30;
const PER_CATEGORY = 300;
const TOP_CATEGORIES = 10;
const PER_AUTHOR = 10;
const FOLLOWED_AUTHORS = 200;
const NEWEST = 300;
/** Only the most recent likes / saves / views / own collections shape the taste profile. */
const SIGNALS_PER_KIND = 500;

/** Pages a recommendation feed can have. */
export const RECOMMENDATION_PAGES = POOL_SIZE / PAGE_SIZE;

type Ranked = { id: number };

/**
 * One page of a ranked pool. Collections the viewer liked or favorited since
 * the pool was cached, or that went private, are left out.
 */
async function toPage(userId: number, ids: number[], page: number): Promise<CollectionListPage> {
    const start = page * PAGE_SIZE;
    const slice = ids.slice(start, start + PAGE_SIZE);
    if (slice.length === 0) return { data: [], hasMore: false };

    const engaged = new Set(
        (
            await db.engagedCollection.findMany({
                where: { userId, collectionId: { in: slice } },
                select: { collectionId: true },
            })
        ).map((row) => row.collectionId),
    );

    const cards = await findCardsByIds(slice.filter((id) => !engaged.has(id)));

    return {
        data: cards.filter((card) => !card.isPrivate),
        hasMore: ids.length > start + PAGE_SIZE,
    };
}

async function rankForUser(userId: number): Promise<number[]> {
    const rows = await db.$queryRaw<Ranked[]>`
        WITH signals AS (
            SELECT id, SUM(w) AS w FROM (
                (SELECT "collectionId" AS id, 3.0 AS w FROM "Like" WHERE "userId" = ${userId}
                 ORDER BY id DESC LIMIT ${SIGNALS_PER_KIND})
                UNION ALL
                (SELECT "collectionId", 4.0 FROM "Favorite" WHERE "userId" = ${userId}
                 ORDER BY "createdAt" DESC LIMIT ${SIGNALS_PER_KIND})
                UNION ALL
                (SELECT "collectionId", LEAST("count", 3) * 1.0 FROM "CollectionView" WHERE "userId" = ${userId}
                 ORDER BY "lastViewedAt" DESC LIMIT ${SIGNALS_PER_KIND})
                UNION ALL
                (SELECT id, 2.0 FROM "Collection" WHERE "userId" = ${userId}
                 ORDER BY id DESC LIMIT ${SIGNALS_PER_KIND})
            ) s
            GROUP BY id
        ),
        tag_pref AS (
            SELECT ct."tagId", LEAST(SUM(s.w), 10) AS w
            FROM signals s
            JOIN "CollectionTag" ct ON ct."collectionId" = s.id
            GROUP BY ct."tagId"
            ORDER BY w DESC, ct."tagId" DESC
            LIMIT ${TOP_TAGS}
        ),
        category_pref AS (
            SELECT "categoryId", SUM(w) AS w FROM (
                SELECT c."categoryId", s.w FROM signals s JOIN "Collection" c ON c.id = s.id
                UNION ALL
                SELECT "categoryId", 5.0 FROM "UserInterest" WHERE "userId" = ${userId}
            ) p
            GROUP BY "categoryId"
            ORDER BY w DESC, "categoryId" DESC
            LIMIT ${TOP_CATEGORIES}
        ),
        followed AS (
            SELECT "followingId" AS id FROM "Follow" WHERE "followerId" = ${userId}
            ORDER BY "followingId" DESC
            LIMIT ${FOLLOWED_AUTHORS}
        ),
        candidates AS (
            SELECT t.id FROM tag_pref tp CROSS JOIN LATERAL (
                SELECT ct."collectionId" AS id FROM "CollectionTag" ct
                WHERE ct."tagId" = tp."tagId"
                ORDER BY ct."collectionId" DESC
                LIMIT ${PER_TAG}
            ) t
            UNION
            SELECT k.id FROM category_pref cp CROSS JOIN LATERAL (
                SELECT c.id FROM "Collection" c
                WHERE c.private = FALSE AND c."categoryId" = cp."categoryId"
                ORDER BY c."createdAt" DESC
                LIMIT ${PER_CATEGORY}
            ) k
            UNION
            SELECT a.id FROM followed f CROSS JOIN LATERAL (
                SELECT c.id FROM "Collection" c
                WHERE c."userId" = f.id AND c.private = FALSE
                ORDER BY c.id DESC
                LIMIT ${PER_AUTHOR}
            ) a
            UNION
            SELECT n.id FROM (
                SELECT c.id FROM "Collection" c WHERE c.private = FALSE
                ORDER BY c.id DESC
                LIMIT ${NEWEST}
            ) n
        )
        SELECT c.id
        FROM candidates cand
        JOIN "Collection" c ON c.id = cand.id
        LEFT JOIN category_pref cp ON cp."categoryId" = c."categoryId"
        LEFT JOIN LATERAL (
            SELECT SUM(tp.w) AS w
            FROM "CollectionTag" ct
            JOIN tag_pref tp ON tp."tagId" = ct."tagId"
            WHERE ct."collectionId" = c.id
        ) tags ON TRUE
        WHERE c.private = FALSE
          AND c."userId" IS DISTINCT FROM ${userId}
          AND NOT EXISTS (
              SELECT 1 FROM "EngagedCollection" e WHERE e."collectionId" = c.id AND e."userId" = ${userId}
          )
        ORDER BY
            COALESCE(tags.w, 0)
            + 0.3 * COALESCE(cp.w, 0)
            + CASE WHEN c."userId" IN (SELECT id FROM followed) THEN 6 ELSE 0 END
            + 1.5 * LN(1 + c."likeCount")
            + 3.0 / (1 + EXTRACT(EPOCH FROM ((NOW() AT TIME ZONE 'UTC') - c."createdAt")) / 86400 / 14)
            - CASE WHEN EXISTS (SELECT 1 FROM signals s WHERE s.id = c.id) THEN 4 ELSE 0 END
            DESC,
            c.id DESC
        LIMIT ${POOL_SIZE}
    `;

    return rows.map((row) => row.id);
}

/** Personal "For you" feed. */
export async function recommendForUser(userId: number, page: number): Promise<CollectionListPage> {
    const ids = await withCache(
        RECOMMENDATIONS_CACHE_NAMESPACE,
        `user:${userId}`,
        POOL_TTL_SECONDS,
        () => rankForUser(userId),
    );

    return toPage(userId, ids, page);
}

async function rankForBoard(userId: number, boardId: number): Promise<number[]> {
    const rows = await db.$queryRaw<Ranked[]>`
        WITH saved AS (
            SELECT bc."collectionId" AS id
            FROM "BoardCollection" bc
            JOIN "Board" b ON b.id = bc."boardId"
            WHERE bc."boardId" = ${boardId} AND b."userId" = ${userId}
            ORDER BY bc."createdAt" DESC
            LIMIT ${SIGNALS_PER_KIND}
        ),
        tag_pref AS (
            SELECT ct."tagId", COUNT(*) * 1.0 AS w
            FROM saved s JOIN "CollectionTag" ct ON ct."collectionId" = s.id
            GROUP BY ct."tagId"
            ORDER BY w DESC, ct."tagId" DESC
            LIMIT ${TOP_TAGS}
        ),
        category_pref AS (
            SELECT c."categoryId", COUNT(*) * 1.0 AS w
            FROM saved s JOIN "Collection" c ON c.id = s.id
            GROUP BY c."categoryId"
            ORDER BY w DESC, c."categoryId" DESC
            LIMIT ${TOP_CATEGORIES}
        ),
        candidates AS (
            SELECT t.id FROM tag_pref tp CROSS JOIN LATERAL (
                SELECT ct."collectionId" AS id FROM "CollectionTag" ct
                WHERE ct."tagId" = tp."tagId"
                ORDER BY ct."collectionId" DESC
                LIMIT ${PER_TAG}
            ) t
            UNION
            SELECT k.id FROM category_pref cp CROSS JOIN LATERAL (
                SELECT c.id FROM "Collection" c
                WHERE c.private = FALSE AND c."categoryId" = cp."categoryId"
                ORDER BY c."createdAt" DESC
                LIMIT ${PER_CATEGORY}
            ) k
        )
        SELECT c.id
        FROM candidates cand
        JOIN "Collection" c ON c.id = cand.id
        LEFT JOIN category_pref cp ON cp."categoryId" = c."categoryId"
        LEFT JOIN LATERAL (
            SELECT SUM(tp.w) AS w
            FROM "CollectionTag" ct
            JOIN tag_pref tp ON tp."tagId" = ct."tagId"
            WHERE ct."collectionId" = c.id
        ) tags ON TRUE
        WHERE c.private = FALSE
          AND c."userId" IS DISTINCT FROM ${userId}
          AND c.id NOT IN (SELECT id FROM saved)
          AND NOT EXISTS (
              SELECT 1 FROM "EngagedCollection" e WHERE e."collectionId" = c.id AND e."userId" = ${userId}
          )
        ORDER BY
            2.0 * COALESCE(tags.w, 0)
            + 1.0 * COALESCE(cp.w, 0)
            + 0.75 * LN(1 + c."likeCount")
            DESC,
            c.id DESC
        LIMIT ${POOL_SIZE}
    `;

    return rows.map((row) => row.id);
}

/**
 * "More like this board": collections sharing the board's tags (each shared
 * tag weighs as often as it appears on the board) and categories, boosted by
 * likes. Collections already on the board or ever liked or favorited are left
 * out (saving to a board favorites the collection, so it drops out at once).
 */
export async function recommendForBoard(
    userId: number,
    boardId: number,
    page: number,
): Promise<CollectionListPage> {
    const ids = await withCache(
        RECOMMENDATIONS_CACHE_NAMESPACE,
        `board:${userId}:${boardId}`,
        POOL_TTL_SECONDS,
        () => rankForBoard(userId, boardId),
    );

    return toPage(userId, ids, page);
}

/** Counts a signed-in view, at most once per collection every 10 minutes. */
export async function recordView(userId: number, collectionId: number) {
    await db.$executeRaw`
        INSERT INTO "CollectionView" ("userId", "collectionId", "lastViewedAt")
        VALUES (${userId}, ${collectionId}, NOW() AT TIME ZONE 'UTC')
        ON CONFLICT ("userId", "collectionId") DO UPDATE
        SET "count" = "CollectionView"."count" + 1, "lastViewedAt" = NOW() AT TIME ZONE 'UTC'
        WHERE "CollectionView"."lastViewedAt" < (NOW() AT TIME ZONE 'UTC') - INTERVAL '10 minutes'
    `;
}
