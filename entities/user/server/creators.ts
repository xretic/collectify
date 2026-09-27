import 'server-only';
import { db } from '@/shared/server/db';
import type { TopCreator } from '../model/types';

/** Most-liked public collections read per request (from the likes index). */
const CANDIDATE_COLLECTIONS = 1500;
const CREATORS_LIMIT = 12;

/**
 * Authors of the most liked public collections in the given categories (all
 * categories when empty): who a brand-new account should follow first, when
 * it has no network for "People you may know" yet. Skips the viewer, people
 * they already follow and banned accounts.
 */
export function listTopCreators(viewerId: number, categoryIds: number[]): Promise<TopCreator[]> {
    return db.$queryRaw<TopCreator[]>`
        WITH top AS (
            SELECT c."userId", c."bannerUrl", c."likeCount"
            FROM "Collection" c
            WHERE c."private" = FALSE
              AND c."userId" IS NOT NULL
              AND c."bannerUrl" <> ''
              AND (cardinality(${categoryIds}::int[]) = 0 OR c."categoryId" = ANY(${categoryIds}::int[]))
            ORDER BY c."likeCount" DESC
            LIMIT ${CANDIDATE_COLLECTIONS}
        ),
        by_author AS (
            SELECT "userId" AS id,
                   SUM("likeCount")::int AS likes,
                   (ARRAY_AGG("bannerUrl" ORDER BY "likeCount" DESC))[1:3] AS covers
            FROM top
            GROUP BY "userId"
        )
        SELECT u."id", u."username", u."fullName", u."avatarUrl", a.covers, a.likes,
               FALSE AS "isFollowed"
        FROM by_author a
        JOIN "User" u ON u."id" = a.id
        WHERE u."id" <> ${viewerId}
          AND NOT EXISTS (
              SELECT 1 FROM "Follow" f WHERE f."followerId" = ${viewerId} AND f."followingId" = u."id"
          )
          AND NOT EXISTS (
              SELECT 1 FROM "AccountSanction" s
              WHERE s."userId" = u."id"
                AND s.scope = 'ACCOUNT'
                AND s."revokedAt" IS NULL
                AND (s."expiresAt" IS NULL OR s."expiresAt" > (NOW() AT TIME ZONE 'UTC'))
          )
        ORDER BY a.likes DESC, u."id" DESC
        LIMIT ${CREATORS_LIMIT}
    `;
}
