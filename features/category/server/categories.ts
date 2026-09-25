import 'server-only';
import { db, isNotFound, isUniqueViolation } from '@/shared/server/db';
import { conflict, notFound } from '@/shared/server/http';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { writeAudit } from '@/entities/moderation/server/audit';
import { CATEGORIES_CACHE_NAMESPACE } from '@/entities/category/server/queries';
import { COLLECTIONS_CACHE_NAMESPACE } from '@/entities/collection/server/queries';
import type { CategoryPayload, ManagedCategory } from '@/entities/category/model/types';
import type { StaffContext } from '@/features/auth/server/guards';

const managedSelect = {
    id: true,
    slug: true,
    name: true,
    description: true,
    position: true,
    isActive: true,
    _count: { select: { collections: true } },
} as const;

type ManagedRow = {
    _count: { collections: number };
} & Omit<ManagedCategory, 'collections'>;

const toManaged = ({ _count, ...row }: ManagedRow): ManagedCategory => ({
    ...row,
    collections: _count.collections,
});

async function invalidate() {
    await Promise.all([
        bumpCacheNamespace(CATEGORIES_CACHE_NAMESPACE),
        bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE),
    ]);
}

function duplicate(error: unknown): never {
    if (isUniqueViolation(error)) throw conflict('categoryExists');
    throw error;
}

export async function createCategory(ctx: StaffContext, input: CategoryPayload) {
    const category = await db
        .$transaction(async (tx) => {
            const created = await tx.category.create({ data: input, select: managedSelect });
            await writeAudit(
                ctx.actor,
                { action: 'create-category', metadata: { categoryId: created.id, ...input } },
                tx,
            );
            return created;
        })
        .catch(duplicate);

    await invalidate();
    return toManaged(category);
}

export async function updateCategory(
    ctx: StaffContext,
    categoryId: number,
    input: CategoryPayload,
) {
    const category = await db
        .$transaction(async (tx) => {
            const updated = await tx.category.update({
                where: { id: categoryId },
                data: input,
                select: managedSelect,
            });
            await writeAudit(
                ctx.actor,
                { action: 'update-category', metadata: { categoryId, ...input } },
                tx,
            );
            return updated;
        })
        .catch((error) => {
            if (isNotFound(error)) throw notFound('categoryNotFound');
            return duplicate(error);
        });

    await invalidate();
    return toManaged(category);
}

/** Only empty categories can be deleted; archive the others instead. */
export async function deleteCategory(ctx: StaffContext, categoryId: number) {
    await db.$transaction(async (tx) => {
        const category = await tx.category.findUnique({
            where: { id: categoryId },
            select: { id: true, name: true, _count: { select: { collections: true } } },
        });

        if (!category) throw notFound('categoryNotFound');
        if (category._count.collections > 0) {
            throw conflict('categoryInUse');
        }

        await tx.category.delete({ where: { id: categoryId } });
        await writeAudit(
            ctx.actor,
            { action: 'delete-category', metadata: { categoryId, name: category.name } },
            tx,
        );
    });

    await invalidate();
}
