import 'server-only';
import { db, type Tx } from '@/shared/server/db';
import { badRequest } from '@/shared/server/http';
import { COLLECTION_TAGS_LIMIT, TAG_SEARCH_LIMIT } from '@/shared/lib/constants';
import { normalizeTagName } from '../model/schemas';
import type { Tag } from '../model/types';

export const tagRefSelect = { id: true, name: true } as const;

export function findTag(tagId: number): Promise<Tag | null> {
    return db.tag.findUnique({
        where: { id: tagId },
        select: { ...tagRefSelect, categoryId: true, usageCount: true },
    });
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/**
 * Tag suggestions inside one category, or across all of them when
 * `categoryId` is `null` (feed filter).
 *
 * With a query, what the user typed wins: exact match, then prefix, then
 * substring/trigram similarity; popularity (`usageCount`) breaks ties. Without
 * a query the most popular tags are returned.
 *
 * Tags no collection uses yet are only shown to whoever created them, so a
 * freshly made (possibly spam) tag is not suggested to everyone.
 */
export async function searchTags(
    categoryId: number | null,
    query: string,
    viewerId: number | null,
): Promise<Tag[]> {
    const needle = normalizeTagName(query);

    if (!needle) {
        return db.tag.findMany({
            where: {
                ...(categoryId === null ? {} : { categoryId }),
                OR: [{ usageCount: { gt: 0 } }, ...(viewerId ? [{ createdById: viewerId }] : [])],
            },
            orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
            take: TAG_SEARCH_LIMIT,
            select: { ...tagRefSelect, categoryId: true, usageCount: true },
        });
    }

    const prefix = `${escapeLike(needle)}%`;
    const contains = `%${escapeLike(needle)}%`;

    return db.$queryRaw<Tag[]>`
        SELECT "id", "name", "categoryId", "usageCount"
        FROM "Tag"
        WHERE (${categoryId}::int IS NULL OR "categoryId" = ${categoryId})
          AND ("usageCount" > 0 OR "createdById" = ${viewerId}::int)
          AND ("normalized" LIKE ${contains} OR "normalized" % ${needle})
        ORDER BY
            ("normalized" = ${needle}) DESC,
            ("normalized" LIKE ${prefix}) DESC,
            similarity("normalized", ${needle}) DESC,
            "usageCount" DESC,
            "name" ASC
        LIMIT ${TAG_SEARCH_LIMIT}
    `;
}

/**
 * Validates a collection's tag list: at most `COLLECTION_TAGS_LIMIT`, all
 * existing and all from the collection's category. Returns unique ids.
 */
export async function assertTagsInCategory(
    tagIds: number[],
    categoryId: number,
    client: Tx = db,
): Promise<number[]> {
    const unique = [...new Set(tagIds)];

    if (unique.length > COLLECTION_TAGS_LIMIT) {
        throw badRequest('tagsLimit', { limit: COLLECTION_TAGS_LIMIT });
    }
    if (unique.length === 0) return unique;

    const found = await client.tag.count({ where: { id: { in: unique }, categoryId } });
    if (found !== unique.length) throw badRequest('tagsWrongCategory');

    return unique;
}

/** Replaces a collection's tags (usage counters follow via the DB trigger). */
export async function setCollectionTags(tx: Tx, collectionId: number, tagIds: number[]) {
    await tx.collectionTag.deleteMany({
        where: { collectionId, tagId: { notIn: tagIds } },
    });

    if (tagIds.length > 0) {
        await tx.collectionTag.createMany({
            data: tagIds.map((tagId) => ({ collectionId, tagId })),
            skipDuplicates: true,
        });
    }
}
