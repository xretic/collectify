import type { UserPreview } from '@/entities/user/model/types';

export type CollectionComment = {
    id: number;
    text: string;
    createdAt: string;
    /** Set when the text was changed after posting. */
    editedAt: string | null;
    author: UserPreview;
    /** Root comment of the thread; `null` for top-level comments. */
    parentId: number | null;
    /** Who a reply answers (for "@username"). */
    replyTo: { id: number; username: string } | null;
    /** The collection owner hearted this comment. */
    likedByAuthor: boolean;
    /** Number of replies (top-level comments only). */
    replies: number;
};

export type CommentsPage = {
    data: CollectionComment[];
    /** Every comment of the collection, replies included. */
    total: number;
    nextCursor: number | null;
};

export type RepliesPage = {
    data: CollectionComment[];
    nextCursor: number | null;
};
