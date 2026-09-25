import 'server-only';
import { db } from '@/shared/server/db';
import { getInteractableCollection } from '@/entities/collection/server/queries';
import {
    deliverNotifications,
    notifySocial,
    retractSocial,
} from '@/entities/notification/server/notifications';

/*
 * Likes and favorites only change counters, so they do not invalidate the
 * cached anonymous feed: it catches up within its short TTL. Bumping the
 * namespace on every like would make that cache useless under load.
 */

type Engagement = 'LIKE' | 'FAVORITE';

/** Idempotent: liking twice is a no-op (unique index), never a 500. */
export async function engage(kind: Engagement, collectionId: number, userId: number) {
    const collection = await getInteractableCollection(collectionId);
    const key = { userId, collectionId };

    // Only the request that actually adds the row notifies the owner. The
    // engagement record outlives an unlike, so recommendations skip it for good.
    const [{ count }] = await db.$transaction([
        kind === 'LIKE'
            ? db.like.createMany({ data: key, skipDuplicates: true })
            : db.favorite.createMany({ data: key, skipDuplicates: true }),
        db.engagedCollection.createMany({ data: key, skipDuplicates: true }),
    ]);

    if (count > 0 && collection.userId) {
        const notificationId = await notifySocial({
            type: kind,
            senderUserId: userId,
            recipientUserId: collection.userId,
            collectionId,
        });
        await deliverNotifications([notificationId]);
    }
}

export async function disengage(kind: Engagement, collectionId: number, userId: number) {
    const collection = await getInteractableCollection(collectionId);

    let removed: number;
    if (kind === 'LIKE') {
        ({ count: removed } = await db.like.deleteMany({ where: { userId, collectionId } }));
    } else {
        // Boards are subsets of favorites: unsaving takes it off every board too.
        const [favorites] = await db.$transaction([
            db.favorite.deleteMany({ where: { userId, collectionId } }),
            db.boardCollection.deleteMany({ where: { collectionId, board: { userId } } }),
        ]);
        removed = favorites.count;
    }

    if (removed > 0 && collection.userId) {
        await retractSocial({
            type: kind,
            senderUserId: userId,
            recipientUserId: collection.userId,
            collectionId,
        });
    }
}
