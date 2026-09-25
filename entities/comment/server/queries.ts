import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { COMMENTS_PAGE_SIZE, REPLIES_PAGE_SIZE } from '@/shared/lib/constants';
import type { CollectionComment, CommentsPage, RepliesPage } from '../model/types';

export const commentSelect = {
    id: true,
    text: true,
    createdAt: true,
    editedAt: true,
    parentId: true,
    likedByAuthor: true,
    user: { select: { id: true, username: true, avatarUrl: true } },
    replyToUser: { select: { id: true, username: true } },
    _count: { select: { replies: true } },
} satisfies Prisma.CommentSelect;

type CommentRow = Prisma.CommentGetPayload<{ select: typeof commentSelect }>;

export function toComment(row: CommentRow): CollectionComment {
    return {
        id: row.id,
        text: row.text,
        createdAt: row.createdAt.toISOString(),
        editedAt: row.editedAt?.toISOString() ?? null,
        author: row.user,
        parentId: row.parentId,
        replyTo: row.replyToUser,
        likedByAuthor: row.likedByAuthor,
        replies: row._count.replies,
    };
}

/** Top-level comments, newest first, keyset-paginated by id so new comments never shift pages. */
export async function listComments(
    collectionId: number,
    cursor: number | null,
): Promise<CommentsPage> {
    const [rows, total] = await Promise.all([
        db.comment.findMany({
            where: { collectionId, parentId: null, ...(cursor ? { id: { lt: cursor } } : {}) },
            orderBy: { id: 'desc' },
            take: COMMENTS_PAGE_SIZE + 1,
            select: commentSelect,
        }),
        db.comment.count({ where: { collectionId } }),
    ]);

    const page = rows.slice(0, COMMENTS_PAGE_SIZE);

    return {
        data: page.map(toComment),
        total,
        nextCursor: rows.length > COMMENTS_PAGE_SIZE ? page[page.length - 1].id : null,
    };
}

/** Replies of a thread, oldest first (reads like a conversation). */
export async function listReplies(parentId: number, cursor: number | null): Promise<RepliesPage> {
    const rows = await db.comment.findMany({
        where: { parentId, ...(cursor ? { id: { gt: cursor } } : {}) },
        orderBy: { id: 'asc' },
        take: REPLIES_PAGE_SIZE + 1,
        select: commentSelect,
    });

    const page = rows.slice(0, REPLIES_PAGE_SIZE);

    return {
        data: page.map(toComment),
        nextCursor: rows.length > REPLIES_PAGE_SIZE ? page[page.length - 1].id : null,
    };
}
