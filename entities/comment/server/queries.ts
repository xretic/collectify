import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { COMMENTS_PAGE_SIZE } from '@/shared/lib/constants';
import type { CollectionComment, CommentsPage } from '../model/types';

export const commentSelect = {
    id: true,
    text: true,
    createdAt: true,
    user: { select: { id: true, username: true, avatarUrl: true } },
} satisfies Prisma.CommentSelect;

type CommentRow = Prisma.CommentGetPayload<{ select: typeof commentSelect }>;

export function toComment(row: CommentRow): CollectionComment {
    return {
        id: row.id,
        text: row.text,
        createdAt: row.createdAt.toISOString(),
        author: row.user,
    };
}

/** Newest first, keyset-paginated by id so new comments never shift pages. */
export async function listComments(
    collectionId: number,
    cursor: number | null,
): Promise<CommentsPage> {
    const [rows, total] = await Promise.all([
        db.comment.findMany({
            where: { collectionId, ...(cursor ? { id: { lt: cursor } } : {}) },
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
