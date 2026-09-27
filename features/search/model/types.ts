import type { CollectionCard } from '@/entities/collection/model/types';
import type { Tag } from '@/entities/tag/model/types';

export type UserSearchHit = {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string;
};

/** Everything the global search shows for one query. */
export type SearchResults = {
    collections: CollectionCard[];
    tags: Tag[];
    users: UserSearchHit[];
};

export const SEARCH_QUERY_MAX_LENGTH = 60;
