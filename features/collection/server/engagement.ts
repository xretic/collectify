import 'server-only';
import { db } from '@/shared/server/db';
import { bumpCacheNamespace } from '@/shared/server/cache';
import {
    COLLECTIONS_CACHE_NAMESPACE,
    getInteractableCollection,
} from '@/entities/collection/server/queries';
import { notifySocial, retractSocial } from '@/entities/notification/server/notifications';

type Engagement = 'LIKE' | 'FAVORITE';

/** Idempotent: liking twice is a no-op (unique index), never a 500. */
export async function engage(kind: Engagement, collectionId: number, userId: number) {
    const collection = await getInteractableCollection(collectionId);
    const key = { userId, collectionId };

    if (kind === 'LIKE') {
        await db.like.upsert({
            where: { userId_collectionId: key },
            update: {},
            create: key,
        });
    } else {
        await db.favorite.upsert({
            where: { userId_collectionId: key },
            update: {},
            create: key,
        });
    }

    if (collection.userId) {
        await notifySocial({
            type: kind,
            senderUserId: userId,
            recipientUserId: collection.userId,
            collectionId,
        });
    }

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
}

export async function disengage(kind: Engagement, collectionId: number, userId: number) {
    const collection = await getInteractableCollection(collectionId);

    if (kind === 'LIKE') {
        await db.like.deleteMany({ where: { userId, collectionId } });
    } else {
        await db.favorite.deleteMany({ where: { userId, collectionId } });
    }

    if (collection.userId) {
        await retractSocial({
            type: kind,
            senderUserId: userId,
            recipientUserId: collection.userId,
            collectionId,
        });
    }

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
}
