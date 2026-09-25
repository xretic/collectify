'use client';

import { useEffect, useRef } from 'react';

type InfiniteScrollOptions = {
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => void;
    rootMargin?: string;
};

/** Calls `onLoadMore` when the returned sentinel ref scrolls into view. */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
    hasMore,
    loading,
    onLoadMore,
    rootMargin = '600px 0px',
}: InfiniteScrollOptions) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && !loading) onLoadMore();
            },
            { rootMargin },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [hasMore, loading, onLoadMore, rootMargin]);

    return ref;
}
