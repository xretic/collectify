import 'server-only';
import { db } from '@/shared/server/db';
import { forbidden, notFound } from '@/shared/server/http';
import { COMMENTS_PER_USER_LIMIT, REPLIES_PER_USER_LIMIT } from '@/shared/lib/constants';
import { assertNotMuted } from '@/entities/sanction/server/sanctions';
import { getInteractableCollection } from '@/entities/collection/server/queries';
import { commentSelect, toComment } from '@/entities/comment/server/queries';
import {
    deliverNotifications,
    notifyComment,
    notifySocial,
    retractSocial,
} from '@/entities/notification/server/notifications';
import { writeAudit } from '@/entities/moderation/server/audit';
import { assertCanModerate, toStaffContext, type Viewer } from '@/features/auth/server/guards';

/**
 * Top-level comment, or a reply when `replyToId` is set. Replies join the
 * thread of the answered comment (one level deep) and mention its author.
 */
export async function createComment(
    viewer: Viewer,
    collectionId: number,
    text: string,
    replyToId?: number,
) {
    await assertNotMuted(viewer.userId, 'COMMENTS');

    const collection = await getInteractableCollection(collectionId);

    const target = replyToId
        ? await db.comment.findFirst({
              where: { id: replyToId, collectionId },
              select: { id: true, parentId: true, userId: true },
          })
        : null;
    if (replyToId && !target) throw notFound('commentNotFound');

    // Top-level comments and replies have separate per-collection limits, so a
    // conversation has room to go on but nobody can flood a thread (each reply
    // notifies the answered author).
    const written = await db.comment.count({
        where: { userId: viewer.userId, collectionId, parentId: target ? { not: null } : null },
    });
    if (!target && written >= COMMENTS_PER_USER_LIMIT) {
        throw forbidden('commentsLimit', { limit: COMMENTS_PER_USER_LIMIT });
    }
    if (target && written >= REPLIES_PER_USER_LIMIT) {
        throw forbidden('repliesLimit', { limit: REPLIES_PER_USER_LIMIT });
    }

    const comment = await db.comment.create({
        data: {
            userId: viewer.userId,
            collectionId,
            text,
            parentId: target ? (target.parentId ?? target.id) : null,
            // "@username" only when answering a reply; answering the root is implied by the thread.
            replyToUserId: target?.parentId ? target.userId : null,
        },
        select: commentSelect,
    });

    const notificationId = target
        ? await notifyComment({
              type: 'COMMENT_REPLY',
              senderUserId: viewer.userId,
              recipientUserId: target.userId,
              collectionId,
              commentId: comment.id,
          })
        : collection.userId &&
          (await notifyComment({
              type: 'COMMENT',
              senderUserId: viewer.userId,
              recipientUserId: collection.userId,
              collectionId,
              commentId: comment.id,
          }));

    await deliverNotifications([notificationId || null]);

    return toComment(comment);
}

export async function updateComment(viewer: Viewer, commentId: number, text: string) {
    await assertNotMuted(viewer.userId, 'COMMENTS');

    const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { userId: true, text: true },
    });
    if (!comment) throw notFound('commentNotFound');
    if (comment.userId !== viewer.userId) throw forbidden('editOwnCommentsOnly');

    const updated = await db.comment.update({
        where: { id: commentId },
        data: comment.text === text ? {} : { text, editedAt: new Date() },
        select: commentSelect,
    });

    return toComment(updated);
}

/** The collection owner hearts (or un-hearts) a comment, like YouTube's creator heart. */
export async function setAuthorLike(viewer: Viewer, commentId: number, liked: boolean) {
    const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: {
            id: true,
            userId: true,
            collectionId: true,
            collection: { select: { userId: true, private: true } },
        },
    });
    if (!comment || comment.collection.private) throw notFound('commentNotFound');
    if (comment.collection.userId !== viewer.userId) {
        throw forbidden('heartOwnerOnly');
    }

    // Only the request that actually flips the heart notifies (or retracts).
    const { count } = await db.comment.updateMany({
        where: { id: commentId, likedByAuthor: !liked },
        data: { likedByAuthor: liked },
    });
    if (count === 0) return;

    const notification = {
        type: 'COMMENT_LIKED' as const,
        senderUserId: viewer.userId,
        recipientUserId: comment.userId,
        collectionId: comment.collectionId,
        commentId: comment.id,
    };

    if (liked) await deliverNotifications([await notifySocial(notification)]);
    else await retractSocial(notification);
}

/** Authors delete their own comments; staff may delete others' (audited). */
export async function deleteComment(viewer: Viewer, commentId: number) {
    const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true, userId: true, text: true, collectionId: true },
    });
    if (!comment) throw notFound('commentNotFound');

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
}
