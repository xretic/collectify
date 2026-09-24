import 'server-only';
import { db } from '@/shared/server/db';
import { forbidden, notFound } from '@/shared/server/http';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { COMMENTS_PER_USER_LIMIT } from '@/shared/lib/constants';
import { assertNotMuted } from '@/entities/sanction/server/sanctions';
import {
    COLLECTIONS_CACHE_NAMESPACE,
    getInteractableCollection,
} from '@/entities/collection/server/queries';
import { commentSelect, toComment } from '@/entities/comment/server/queries';
import { notifyComment } from '@/entities/notification/server/notifications';
import { writeAudit } from '@/entities/moderation/server/audit';
import { assertCanModerate, toStaffContext, type Viewer } from '@/features/auth/server/guards';

export async function createComment(viewer: Viewer, collectionId: number, text: string) {
    await assertNotMuted(viewer.userId, 'COMMENTS');

    const collection = await getInteractableCollection(collectionId);

    const written = await db.comment.count({ where: { userId: viewer.userId, collectionId } });
    if (written >= COMMENTS_PER_USER_LIMIT) {
        throw forbidden(
            `You can leave at most ${COMMENTS_PER_USER_LIMIT} comments on a collection.`,
        );
    }

    const comment = await db.comment.create({
        data: { userId: viewer.userId, collectionId, text },
        select: commentSelect,
    });

    if (collection.userId) {
        await notifyComment({
            senderUserId: viewer.userId,
            recipientUserId: collection.userId,
            collectionId,
        });
    }

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);

    return toComment(comment);
}

export async function updateComment(viewer: Viewer, commentId: number, text: string) {
    await assertNotMuted(viewer.userId, 'COMMENTS');

    const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { userId: true },
    });
    if (!comment) throw notFound('Comment not found.');
    if (comment.userId !== viewer.userId) throw forbidden('You can only edit your own comments.');

    const updated = await db.comment.update({
        where: { id: commentId },
        data: { text },
        select: commentSelect,
    });

    return toComment(updated);
}

/** Authors delete their own comments; staff may delete others' (audited). */
export async function deleteComment(viewer: Viewer, commentId: number) {
    const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true, text: true, collectionId: true },
    });
    if (!comment) throw notFound('Comment not found.');

    if (comment.userId === viewer.userId) {
        await db.comment.delete({ where: { id: comment.id } });
    } else {
        const ctx = await toStaffContext(viewer);
        await assertCanModerate(ctx, comment.userId);

        await db.$transaction(async (tx) => {
            await writeAudit(
                ctx.actor,
                {
                    action: 'delete-comment',
                    targetUserId: comment.userId,
                    targetCollectionId: comment.collectionId,
                    metadata: { commentId: comment.id, text: comment.text },
                },
                tx,
            );
            await tx.comment.delete({ where: { id: comment.id } });
        });
    }

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
}
