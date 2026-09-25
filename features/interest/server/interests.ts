import 'server-only';
import { db } from '@/shared/server/db';
import { badRequest } from '@/shared/server/http';

export async function getInterests(userId: number): Promise<number[]> {
    const rows = await db.userInterest.findMany({
        where: { userId },
        select: { categoryId: true },
    });
    return rows.map((row) => row.categoryId);
}

/** Replaces the user's interests; only active categories are accepted. */
export async function setInterests(userId: number, categoryIds: number[]) {
    const unique = [...new Set(categoryIds)];

    const active = await db.category.count({ where: { id: { in: unique }, isActive: true } });
    if (active !== unique.length) throw badRequest('Choose existing categories.');

    await db.$transaction([
        db.userInterest.deleteMany({ where: { userId, categoryId: { notIn: unique } } }),
        db.userInterest.createMany({
            data: unique.map((categoryId) => ({ userId, categoryId })),
            skipDuplicates: true,
        }),
    ]);
}
