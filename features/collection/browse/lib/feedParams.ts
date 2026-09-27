import { FEED_TAGS_LIMIT } from '@/shared/lib/constants';
import { COLLECTION_SORTS, type CollectionSort } from '@/entities/collection/model/types';

const isSort = (value: string | null): value is CollectionSort =>
    COLLECTION_SORTS.includes(value as CollectionSort);

/** `?tag=3,7` → [3, 7]: valid, unique ids, at most `FEED_TAGS_LIMIT`. */
export function parseTagIds(value: string) {
    const ids = value
        .split(',')
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);
    return [...new Set(ids)].slice(0, FEED_TAGS_LIMIT);
}

/**
 * Sort / category / tags / search of a collection list from its URL. Shared by
 * the client hook and the server prefetch, so both build the same query key.
 */
export function parseFeedParams(get: (key: string) => string | null | undefined) {
    const sort = get('sort') ?? null;
    return {
        sort: isSort(sort) ? sort : ('popular' as CollectionSort),
        category: get('category')?.trim() || undefined,
        tags: parseTagIds(get('tag') ?? ''),
        query: get('q') ?? '',
    };
}
