import 'server-only';
import { db, escapeLike } from '@/shared/server/db';
import { findCardsByIds } from '@/entities/collection/server/queries';
import { searchTags } from '@/entities/tag/server/queries';
import type { SearchResults, UserSearchHit } from '../model/types';

const COLLECTIONS_LIMIT = 6;
const TAGS_LIMIT = 6;
const USERS_LIMIT = 5;

/** Public collections whose name contains the query; names starting with it first, then popular. */
async function searchCollectionIds(needle: string) {
    const rows = await db.$queryRaw<{ id: number }[]>`
        SELECT "id" FROM "Collection"
        WHERE "private" = FALSE AND "lowerCaseName" LIKE ${`%${escapeLike(needle)}%`}
        ORDER BY ("lowerCaseName" LIKE ${`${escapeLike(needle)}%`}) DESC, "likeCount" DESC, "id" DESC
        LIMIT ${COLLECTIONS_LIMIT}
    `;
    return rows.map((row) => row.id);
}

/** By @username prefix or by name anywhere; exact handles first. */
function searchUsers(needle: string) {
    const handle = needle.replace(/^@/, '');

    return db.$queryRaw<UserSearchHit[]>`
        SELECT "id", "username", "fullName", "avatarUrl" FROM "User"
        WHERE "username" LIKE ${`${escapeLike(handle)}%`}
           OR "fullName" ILIKE ${`%${escapeLike(needle)}%`}
        ORDER BY ("username" = ${handle}) DESC,
                 ("username" LIKE ${`${escapeLike(handle)}%`}) DESC,
                 similarity("fullName", ${needle}) DESC,
                 "id"
        LIMIT ${USERS_LIMIT}
    `;
}

/** One request for the search dialog: collections, tags and people. */
export async function globalSearch(query: string, viewerId: number | null): Promise<SearchResults> {
    const needle = query.trim().toLowerCase();

    const [collectionIds, tags, users] = await Promise.all([
        searchCollectionIds(needle),
        searchTags(null, needle, viewerId),
        searchUsers(needle),
    ]);

    return {
        collections: await findCardsByIds(collectionIds),
        tags: tags.slice(0, TAGS_LIMIT),
        users,
    };
}
