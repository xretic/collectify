import type { ITEM_SIZES } from '@/shared/lib/constants';
import type { UserPreview } from '@/entities/user/model/types';
import type { CategoryRef } from '@/entities/category/model/types';
import type { TagRef } from '@/entities/tag/model/types';

export type CollectionAuthor = UserPreview & { fullName: string };

export type ItemSize = (typeof ITEM_SIZES)[number];

export type CollectionItem = {
    id: number;
    /** May be empty when the item has an image. */
    title: string;
    description: string;
    sourceUrl: string | null;
    imageUrl: string | null;
    size: ItemSize;
    order: number;
};

/** Card in lists (home, profiles, "my collections"). */
export type CollectionCard = {
    id: number;
    name: string;
    bannerUrl: string;
    category: CategoryRef;
    isPrivate: boolean;
    author: CollectionAuthor | null;
    likes: number;
    favorites: number;
    items: number;
    comments: number;
};

export type CollectionDetails = {
    id: number;
    name: string;
    description: string;
    bannerUrl: string;
    category: CategoryRef;
    isPrivate: boolean;
    createdAt: string;
    author: CollectionAuthor;
    tags: TagRef[];
    items: CollectionItem[];
    likes: number;
    favorites: number;
    comments: number;
    liked: boolean;
    favorited: boolean;
    /** The viewer's boards this collection is on. */
    boardIds: number[];
};

export type CollectionSort = 'popular' | 'newest' | 'old';

export const COLLECTION_SORTS: readonly CollectionSort[] = ['popular', 'newest', 'old'];

export type CollectionListParams = {
    sort: CollectionSort;
    page: number;
    /** Category slug. */
    category?: string;
    /** Tag ids; a collection must have all of them. */
    tags?: number[];
    query?: string;
    authorId?: number;
    visibility?: 'public' | 'private';
    favorites?: boolean;
    /** One of the viewer's boards. */
    board?: number;
};

export type CollectionListPage = {
    data: CollectionCard[];
    hasMore: boolean;
};

export type CollectionItemPayload = {
    title: string;
    description: string;
    sourceUrl: string | null;
    imageUrl: string | null;
    size: ItemSize;
};

export type CreateCollectionPayload = {
    name: string;
    description: string;
    categoryId: number;
    tagIds: number[];
    bannerUrl: string;
    isPrivate: boolean;
    item: CollectionItemPayload;
};

export type UpdateCollectionPayload = {
    name: string;
    description: string;
    categoryId: number;
    tagIds: number[];
    bannerUrl: string;
    isPrivate: boolean;
};

export type CollectionStats = {
    days: string[];
    likes: number[];
    comments: number[];
    favorites: number[];
};
