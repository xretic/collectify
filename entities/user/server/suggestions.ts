import 'server-only';
import { db } from '@/shared/server/db';
import { withCache } from '@/shared/server/cache';
import type { SuggestedUser, SuggestionsPage } from '../model/types';

/*
 * "People you may know". Score per candidate (not the viewer, not already
 * followed, not banned):
 *
 *   friends of friends  2 per person the viewer follows who follows the candidate
 *   same city           5 (same country and city)
 *   follows you         3 (the candidate follows the viewer, not followed back)
 *
 * Only candidates with a positive score are suggested. Every input set is
 * bounded (a sample of whom the viewer follows and of whom they follow, the
 * newest fans and neighbours), so the cost does not grow with how many
 * accounts the viewer's network follows. The ranked pool is cached per viewer
 * and pages are cut from it, so paging stays stable and cheap.
 */

export const SUGGESTIONS_CACHE_NAMESPACE = 'suggestions';

/** Ranked suggestions kept per viewer (the deepest `skip` allowed). */
export const SUGGESTIONS_POOL_SIZE = 500;
const POOL_TTL_SECONDS = 300;

/** Followed accounts sampled for friends of friends, and follows read per sampled account. */
const FOLLOWING_SAMPLE = 500;
const FOLLOWS_PER_FOLLOWED = 200;
/** Newest fans and same-city accounts considered. */
const FANS_LIMIT = 1000;
const NEIGHBOURS_LIMIT = 1000;

type Row = {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string;
    city: string | null;
    mutual: number;
    sameCity: boolean;
    followsYou: boolean;
};

function rankSuggestions(userId: number): Promise<Row[]> {
    return db.$queryRaw<Row[]>`
        WITH me AS (
            SELECT country, "cityKey" FROM "User" WHERE id = ${userId}
        ),
        following AS (
            SELECT "followingId" AS id FROM "Follow" WHERE "followerId" = ${userId}
            ORDER BY "followingId" DESC
            LIMIT ${FOLLOWING_SAMPLE}
        ),
        mutual AS (
            SELECT f.id, COUNT(*)::int AS n
            FROM following fr
            CROSS JOIN LATERAL (
                SELECT "followingId" AS id FROM "Follow" WHERE "followerId" = fr.id
                ORDER BY "followingId" DESC
                LIMIT ${FOLLOWS_PER_FOLLOWED}
            ) f
            GROUP BY f.id
        ),
        fans AS (
            SELECT "followerId" AS id FROM "Follow" WHERE "followingId" = ${userId}
            ORDER BY "followerId" DESC
            LIMIT ${FANS_LIMIT}
        ),
        neighbours AS (
            SELECT u.id
            FROM "User" u
            JOIN me ON u.country = me.country AND u."cityKey" = me."cityKey"
            ORDER BY u.id DESC
            LIMIT ${NEIGHBOURS_LIMIT}
        ),
        pool AS (
            SELECT id FROM mutual
            UNION
            SELECT id FROM fans
            UNION
            SELECT id FROM neighbours
        ),
        candidates AS (
            SELECT
                u.id, u.username, u."fullName", u."avatarUrl", u.city,
                COALESCE(m.n, 0) AS mutual,
                (u."cityKey" IS NOT NULL AND u."cityKey" = me."cityKey" AND u.country = me.country)
                    AS "sameCity",
                EXISTS (
                    SELECT 1 FROM "Follow" x WHERE x."followerId" = u.id AND x."followingId" = ${userId}
                ) AS "followsYou"
            FROM pool p
            JOIN "User" u ON u.id = p.id
            CROSS JOIN me
            LEFT JOIN mutual m ON m.id = u.id
            WHERE u.id <> ${userId}
              AND NOT EXISTS (
                  SELECT 1 FROM "Follow" x WHERE x."followerId" = ${userId} AND x."followingId" = u.id
              )
              AND NOT EXISTS (
                  SELECT 1 FROM "AccountSanction" a
                  WHERE a."userId" = u.id
                    AND a.scope = 'ACCOUNT'
                    AND a."revokedAt" IS NULL
                    AND (a."expiresAt" IS NULL OR a."expiresAt" > (NOW() AT TIME ZONE 'UTC'))
              )
        ),
        scored AS (
            SELECT *,
                2 * mutual
                + CASE WHEN "sameCity" THEN 5 ELSE 0 END
                + CASE WHEN "followsYou" THEN 3 ELSE 0 END AS score
            FROM candidates
        )
        SELECT id, username, "fullName", "avatarUrl", city, mutual, "sameCity", "followsYou"
        FROM scored
        WHERE score > 0
        ORDER BY score DESC, mutual DESC, id DESC
        LIMIT ${SUGGESTIONS_POOL_SIZE}
    `;
}

export async function suggestPeople(
    userId: number,
    { skip, take }: { skip: number; take: number },
): Promise<SuggestionsPage> {
    const pool = await withCache(
        SUGGESTIONS_CACHE_NAMESPACE,
        `user:${userId}`,
        POOL_TTL_SECONDS,
        () => rankSuggestions(userId),
    );
    const rows = pool.slice(skip, skip + take);

    // The pool may predate follows made since; those stay listed as followed.
    const followed = new Set(
        (
            await db.follow.findMany({
                where: { followerId: userId, followingId: { in: rows.map((row) => row.id) } },
                select: { followingId: true },
            })
        ).map((row) => row.followingId),
    );

    return {
        data: rows.map(
            (row): SuggestedUser => ({
                id: row.id,
                username: row.username,
                fullName: row.fullName,
                avatarUrl: row.avatarUrl,
                mutual: row.mutual,
                city: row.sameCity ? row.city : null,
                followsYou: row.followsYou,
                isFollowed: followed.has(row.id),
            }),
        ),
        hasMore: pool.length > skip + take,
    };
}
