import 'server-only';
import { db } from '@/shared/server/db';
import { forbidden, notFound } from '@/shared/server/http';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { COLLECTIONS_PER_USER_LIMIT } from '@/shared/lib/constants';
import {
    COLLECTIONS_CACHE_NAMESPACE,
    getOwnedCollection,
} from '@/entities/collection/server/queries';
import { writeAudit } from '@/entities/moderation/server/audit';
import { assertActiveCategory } from '@/entities/category/server/queries';
import { assertTagsInCategory, setCollectionTags } from '@/entities/tag/server/queries';
import { assertCanModerate, toStaffContext, type Viewer } from '@/features/auth/server/guards';
import type {
    CreateCollectionPayload,
    UpdateCollectionPayload,
} from '@/entities/collection/model/types';

export async function createCollection(userId: number, input: CreateCollectionPayload) {
    const owned = await db.collection.count({ where: { userId } });
    if (owned >= COLLECTIONS_PER_USER_LIMIT) {
        throw forbidden(`You can have at most ${COLLECTIONS_PER_USER_LIMIT} collections.`);
    }

    await assertActiveCategory(input.categoryId);
    const tagIds = await assertTagsInCategory(input.tagIds, input.categoryId);

    const collection = await db.collection.create({
        data: {
            userId,
            name: input.name,
            lowerCaseName: input.name.toLowerCase(),
            description: input.description,
            categoryId: input.categoryId,
            bannerUrl: input.bannerUrl,
            private: input.isPrivate,
            items: { create: { ...input.item, order: 0 } },
            tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
        select: { id: true },
    });

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);

    return collection.id;
}

export async function updateCollection(
    collectionId: number,
    userId: number,
    input: UpdateCollectionPayload,
) {
    await getOwnedCollection(collectionId, userId);

    const current = await db.collection.findUnique({
        where: { id: collectionId },
        select: { categoryId: true },
    });
    // Keeping an archived category is fine; switching into one is not.
    if (current?.categoryId !== input.categoryId) await assertActiveCategory(input.categoryId);

    await db.$transaction(async (tx) => {
        const tagIds = await assertTagsInCategory(input.tagIds, input.categoryId, tx);

        await tx.collection.update({
            where: { id: collectionId },
            data: {
                name: input.name,
                lowerCaseName: input.name.toLowerCase(),
                description: input.description,
                categoryId: input.categoryId,
                bannerUrl: input.bannerUrl,
                private: input.isPrivate,
            },
        });

        await setCollectionTags(tx, collectionId, tagIds);
    });

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
}

/** Owners delete their own collections; staff may delete others' (audited). */
export async function deleteCollection(collectionId: number, viewer: Viewer) {
    const collection = await db.collection.findUnique({
        where: { id: collectionId },
        select: { id: true, userId: true, name: true },
    });

    if (!collection) throw notFound('Collection not found.');

    if (collection.userId === viewer.userId) {
        await db.collection.delete({ where: { id: collection.id } });
    } else {
        const ctx = await toStaffContext(viewer);
        if (collection.userId) await assertCanModerate(ctx, collection.userId);

        await db.$transaction(async (tx) => {
            await writeAudit(
                ctx.actor,
                {
                    action: 'delete-collection',
                    targetUserId: collection.userId,
                    metadata: { collectionId: collection.id, name: collection.name },
                },
                tx,
            );
            await tx.collection.delete({ where: { id: collection.id } });
        });
    }

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
}
