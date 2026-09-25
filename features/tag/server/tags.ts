import 'server-only';
import { db, isUniqueViolation } from '@/shared/server/db';
import { apiError, badRequest, notFound } from '@/shared/server/http';
import { TAGS_PER_USER_DAILY_LIMIT } from '@/shared/lib/constants';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { writeAudit } from '@/entities/moderation/server/audit';
import { COLLECTIONS_CACHE_NAMESPACE } from '@/entities/collection/server/queries';
import type { StaffContext } from '@/features/auth/server/guards';
import { tagRefSelect } from '@/entities/tag/server/queries';
import { normalizeTagName } from '@/entities/tag/model/schemas';
import type { Tag } from '@/entities/tag/model/types';

const tagSelect = { ...tagRefSelect, categoryId: true, usageCount: true } as const;

/**
 * Returns the category's tag with this name, creating it (globally, for
 * everyone) when it does not exist yet.
 */
export async function findOrCreateTag(
    userId: number,
    input: { categoryId: number; name: string },
): Promise<Tag> {
    const category = await db.category.findUnique({
        where: { id: input.categoryId },
        select: { isActive: true },
    });
    if (!category?.isActive) throw badRequest('categoryUnknown');

    const key = { categoryId: input.categoryId, normalized: normalizeTagName(input.name) };

    const existing = await db.tag.findUnique({
        where: { categoryId_normalized: key },
        select: tagSelect,
    });
    if (existing) return existing;

    const createdToday = await db.tag.count({
        where: { createdById: userId, createdAt: { gt: new Date(Date.now() - 86_400_000) } },
    });
    if (createdToday >= TAGS_PER_USER_DAILY_LIMIT) {
        throw apiError(429, 'tagsDailyLimit');
    }

    try {
        return await db.tag.create({
            data: { ...key, name: input.name, createdById: userId },
            select: tagSelect,
        });
    } catch (error) {
        // Someone created the same tag concurrently.
        if (!isUniqueViolation(error)) throw error;
        return db.tag.findUniqueOrThrow({
            where: { categoryId_normalized: key },
            select: tagSelect,
        });
    }
}

/** Staff removal of a spam/abusive tag; it disappears from every collection. */
export async function deleteTag(ctx: StaffContext, tagId: number) {
    await db.$transaction(async (tx) => {
        const tag = await tx.tag.findUnique({
            where: { id: tagId },
            select: { name: true, categoryId: true, usageCount: true },
        });
        if (!tag) throw notFound('tagNotFound');

        await tx.tag.delete({ where: { id: tagId } });
        await writeAudit(ctx.actor, { action: 'delete-tag', metadata: { tagId, ...tag } }, tx);
    });

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
}
