import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { badRequest } from '@/shared/server/http';
import { withCache } from '@/shared/server/cache';
import type { Category, CategoryShowcase, ManagedCategory } from '../model/types';

export const CATEGORIES_CACHE_NAMESPACE = 'categories';

export const categoryRefSelect = {
    id: true,
    slug: true,
    name: true,
} satisfies Prisma.CategorySelect;

const categorySelect = {
    ...categoryRefSelect,
    description: true,
    position: true,
} satisfies Prisma.CategorySelect;

const ORDER: Prisma.CategoryOrderByWithRelationInput[] = [{ position: 'asc' }, { name: 'asc' }];

export function listActiveCategories(): Promise<Category[]> {
    return withCache(CATEGORIES_CACHE_NAMESPACE, 'active', 600, () =>
        db.category.findMany({ where: { isActive: true }, select: categorySelect, orderBy: ORDER }),
    );
}

export async function listManagedCategories(): Promise<ManagedCategory[]> {
    const rows = await db.category.findMany({
        select: { ...categorySelect, isActive: true, _count: { select: { collections: true } } },
        orderBy: ORDER,
    });

    return rows.map(({ _count, ...row }) => ({ ...row, collections: _count.collections }));
}

/** New collections may only use active categories. */
export async function assertActiveCategory(categoryId: number) {
    const category = await db.category.findUnique({
        where: { id: categoryId },
        select: { isActive: true },
    });

    if (!category?.isActive) throw badRequest('Choose an existing category.');
}

/** Pool of top collections per category that the cover is picked from. */
const SHOWCASE_POOL = 10;

/** Pools only change as likes add up, so they are cached for a while. */
const SHOWCASE_POOL_TTL_SECONDS = 600;

type ShowcaseCover = { categoryId: number; bannerUrl: string };

/** Top public collections per active category, each read from the `likeCount` index. */
function listShowcasePools(): Promise<ShowcaseCover[]> {
    return withCache(
        CATEGORIES_CACHE_NAMESPACE,
        'showcase-pools',
        SHOWCASE_POOL_TTL_SECONDS,
        () =>
            db.$queryRaw<ShowcaseCover[]>`
            SELECT k.id AS "categoryId", top."bannerUrl"
            FROM "Category" k
            CROSS JOIN LATERAL (
                SELECT c."bannerUrl"
                FROM "Collection" c
                WHERE c.private = FALSE AND c."categoryId" = k.id AND c."bannerUrl" <> ''
                ORDER BY c."likeCount" DESC, c.id DESC
                LIMIT ${SHOWCASE_POOL}
            ) top
            WHERE k."isActive" = TRUE
        `,
    );
}

/**
 * Active categories, each with the banner of a random collection among its
 * most liked public ones (a fresh pick on every call, from a cached pool).
 */
export async function listCategoryShowcase(): Promise<CategoryShowcase[]> {
    const [categories, pools] = await Promise.all([listActiveCategories(), listShowcasePools()]);

    const poolByCategory = new Map<number, string[]>();
    for (const { categoryId, bannerUrl } of pools) {
        const pool = poolByCategory.get(categoryId);
        if (pool) pool.push(bannerUrl);
        else poolByCategory.set(categoryId, [bannerUrl]);
    }

    return categories.map((category) => {
        const pool = poolByCategory.get(category.id);
        return {
            ...category,
            coverUrl: pool ? pool[Math.floor(Math.random() * pool.length)] : null,
        };
    });
}
