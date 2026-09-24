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

    const collection = await db.collection.create({
        data: {
            userId,
            name: input.name,
            lowerCaseName: input.name.toLowerCase(),
            description: input.description,
            category: input.category,
            bannerUrl: input.bannerUrl,
            private: input.isPrivate,
            items: { create: { ...input.item, order: 0 } },
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

    await db.collection.update({
        where: { id: collectionId },
        data: {
            name: input.name,
            lowerCaseName: input.name.toLowerCase(),
            description: input.description,
            bannerUrl: input.bannerUrl,
            private: input.isPrivate,
        },
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
