import type { UserPreview } from '@/entities/user/model/types';

export type CollectionComment = {
    id: number;
    text: string;
    createdAt: string;
    author: UserPreview;
};

export type CommentsPage = {
    data: CollectionComment[];
    total: number;
    nextCursor: number | null;
};
