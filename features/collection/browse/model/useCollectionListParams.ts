'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import { CATEGORIES, type Category } from '@/shared/lib/constants';
import { COLLECTION_SORTS, type CollectionSort } from '@/entities/collection/model/types';

const isSort = (value: string | null): value is CollectionSort =>
    COLLECTION_SORTS.includes(value as CollectionSort);

const isCategory = (value: string | null): value is Category =>
    CATEGORIES.includes(value as Category);

/**
 * Sort / page / category / search of a collection list, kept in the URL so
 * lists are shareable and survive reloads and back navigation.
 */
export function useCollectionListParams() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sortParam = searchParams.get('sort');
    const categoryParam = searchParams.get('category');
    const urlQuery = searchParams.get('q') ?? '';

    const sort: CollectionSort = isSort(sortParam) ? sortParam : 'popular';
    const category: Category | undefined = isCategory(categoryParam) ? categoryParam : undefined;
    const page = Math.max(0, Number(searchParams.get('page')) || 0);

    // The input updates instantly; the URL (and the request) follows after a debounce.
    const [queryInput, setQueryInput] = useState(urlQuery);
    const debouncedQuery = useDebounce(queryInput.trim());

    const update = useCallback(
        (changes: Record<string, string | number | undefined>, resetPage = true) => {
            const next = new URLSearchParams(searchParams.toString());

            for (const [key, value] of Object.entries(changes)) {
                if (value === undefined || value === '' || value === 0) next.delete(key);
                else next.set(key, String(value));
            }

            if (resetPage && !('page' in changes)) next.delete('page');

            const search = next.toString();
            router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    useEffect(() => {
        if (debouncedQuery !== urlQuery) update({ q: debouncedQuery });
    }, [debouncedQuery, urlQuery, update]);

    return {
        sort,
        page,
        category,
        query: urlQuery,
        queryInput,
        setQueryInput,
        setSort: (value: CollectionSort) =>
            update({ sort: value === 'popular' ? undefined : value }),
        setCategory: (value: Category | undefined) => update({ category: value }),
        setPage: (value: number) => update({ page: value }, false),
        update,
    };
}
