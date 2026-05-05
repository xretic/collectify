import type { CollectionPropsAdditional } from '@/types/CollectionField';

export type { CollectionFieldProps, CollectionPropsAdditional } from '@/types/CollectionField';

export type CollectionItem = CollectionPropsAdditional['items'][number];

export type CollectionActionType = 'like' | 'dislike' | 'favorite' | 'unfavorite';

export type CollectionItemPayload = {
    title: string;
    description: string;
    sourceUrl: string | null;
    imageUrl: string | null;
};

export type CollectionSearchParams = {
    sortedBy: string | number;
    skip: number;
    privateOnly: boolean;
    category?: string;
    userId?: number | null;
    query?: string;
    authorId?: number | null;
    favoritesUserId?: number | null;
    followed?: boolean;
};

export type CreateCollectionPayload = {
    name: string;
    description: string;
    category: string;
    banner: string;
    itemTitle: string;
    itemDescription: string;
    itemImageUrl: string | null;
    itemSourceUrl: string | null;
    isPrivate: string;
};

export type CollectionOrderItem = {
    id: number;
    order: number;
};

export type CollectionStats = {
    days: string[];
    likesData: number[];
    commentsData: number[];
    favoritesData: number[];
};
