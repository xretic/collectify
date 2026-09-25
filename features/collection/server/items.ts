import 'server-only';
import { db } from '@/shared/server/db';
import { badRequest, forbidden, notFound } from '@/shared/server/http';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { COLLECTION_ITEMS_LIMIT } from '@/shared/lib/constants';
import {
    COLLECTIONS_CACHE_NAMESPACE,
    getOwnedCollection,
    normalizeItemOrder,
} from '@/entities/collection/server/queries';
import type { CollectionItemPayload } from '@/entities/collection/model/types';

const itemSelect = {
    id: true,
    title: true,
    description: true,
    sourceUrl: true,
    imageUrl: true,
    size: true,
    order: true,
} as const;

async function getOwnedItem(collectionId: number, itemId: number, userId: number) {
    await getOwnedCollection(collectionId, userId);

    const item = await db.item.findFirst({
        where: { id: itemId, collectionId },
        select: { id: true },
    });
    if (!item) throw notFound('itemNotFound');

    return item;
}

export async function addItem(collectionId: number, userId: number, input: CollectionItemPayload) {
    await getOwnedCollection(collectionId, userId);

    const item = await db.$transaction(async (tx) => {
        const count = await tx.item.count({ where: { collectionId } });
        if (count >= COLLECTION_ITEMS_LIMIT) {
            throw forbidden('itemsLimit', { limit: COLLECTION_ITEMS_LIMIT });
        }

        await normalizeItemOrder(tx, collectionId);

        return tx.item.create({
            data: { ...input, collectionId, order: count },
            select: itemSelect,
        });
    });

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);

    return item;
}

export async function updateItem(
    collectionId: number,
    itemId: number,
    userId: number,
    input: CollectionItemPayload,
) {
    await getOwnedItem(collectionId, itemId, userId);

    return db.item.update({ where: { id: itemId }, data: input, select: itemSelect });
}

export async function removeItem(collectionId: number, itemId: number, userId: number) {
    await getOwnedItem(collectionId, itemId, userId);

    await db.$transaction(async (tx) => {
        const count = await tx.item.count({ where: { collectionId } });
        if (count <= 1) throw forbidden('collectionNeedsItem');

        await tx.item.delete({ where: { id: itemId } });
        await normalizeItemOrder(tx, collectionId);
    });

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
}

/** `itemIds` must list every item of the collection exactly once, in the new order. */
export async function reorderItems(collectionId: number, userId: number, itemIds: number[]) {
    await getOwnedCollection(collectionId, userId);

    await db.$transaction(async (tx) => {
        const items = await tx.item.findMany({ where: { collectionId }, select: { id: true } });
        const known = new Set(items.map((item) => item.id));

        if (
            itemIds.length !== known.size ||
            new Set(itemIds).size !== itemIds.length ||
            itemIds.some((id) => !known.has(id))
        ) {
            throw badRequest('invalidItemOrder');
        }

        await Promise.all(
            itemIds.map((id, order) => tx.item.update({ where: { id }, data: { order } })),
        );
    });
}
