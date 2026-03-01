'use client';

import { useUser } from '@/context/UserProvider';
import { CATEGORIES, PAGE_SIZE } from '@/lib/constans';
import { useUIStore } from '@/stores/uiStore';
import { Avatar, Button } from '@mui/material';
import { Suspense, useMemo, useState } from 'react';
import CollectionSearchBar from '@/components/features/collections/CollectionSearchBar';
import { useCollectionSearchStore } from '@/stores/collectionSearchStore';
import { usePaginationStore } from '@/stores/paginationStore';
import CollectionsWrapper from '@/components/features/collections/CollectionsWrapper';
import SortBy from '@/components/ui/SortBy';
import styles from './home.module.css';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/lib/useDebounce';
import { api } from '@/lib/api';
import { CollectionFieldProps } from '@/types/CollectionField';
import HomePageSkeleton from '@/components/skeletons/HomePageSkeleton';

export default function HomePage() {
    const { user, loading } = useUser();

    const [category, setCategory] = useState('');

    const { query } = useCollectionSearchStore();
    const { sortedBy } = useUIStore();
    const { homePagination } = usePaginationStore();

    const debouncedQuery = useDebounce(query, 400);

    const params = useMemo(() => {
        const query = (debouncedQuery ?? '').trim();

        return {
            sortedBy: String(sortedBy),
            skip: homePagination * PAGE_SIZE,
            category: category || '',
            userId: user?.id ?? null,
            query: query,
        };
    }, [sortedBy, homePagination, category, user?.id, debouncedQuery]);

    const { data, isFetching } = useQuery({
        queryKey: ['collections-search', params],
        enabled: !loading,
        staleTime: 30_000,
        queryFn: async () => {
            const searchParams = new URLSearchParams({
                sortedBy: params.sortedBy,
                skip: String(params.skip),
            });

            if (params.category) searchParams.set('category', params.category);
            if (params.userId != null) searchParams.set('userId', String(params.userId));
            if (params.query) searchParams.set('query', params.query);

            return api
                .get(`api/collections/search/?${searchParams.toString()}`)
                .json<{ data: CollectionFieldProps[] }>();
        },
    });

    const collections = data?.data ?? [];

    if (loading && !user) return null;
    if (isFetching) return <HomePageSkeleton />;

    return (
        <Suspense>
            <div className={styles['container']}>
                <div>
                    <div className={styles['title']}>
                        {user ? (
                            <>
                                <Avatar
                                    src={user.avatarUrl}
                                    alt={user.username}
                                    sx={{ width: 40, height: 40 }}
                                />
                                <span>Welcome back, {user.username}!</span>
                            </>
                        ) : (
                            <span>Discover collections</span>
                        )}
                    </div>
                </div>

                <div className={styles['categories']}>
                    <Button
                        onClick={() => setCategory('')}
                        variant={category === '' ? 'contained' : 'outlined'}
                        sx={{ borderRadius: 6, height: 35, textTransform: 'none' }}
                    >
                        All
                    </Button>

                    {CATEGORIES.map((x) => (
                        <Button
                            key={x}
                            onClick={() => setCategory(x)}
                            variant={category === x ? 'contained' : 'outlined'}
                            sx={{ borderRadius: 6, height: 35, textTransform: 'none' }}
                        >
                            {x}
                        </Button>
                    ))}

                    <SortBy disabled={collections.length === 0} />
                    <CollectionSearchBar disabled={query === '' && collections.length === 0} />
                </div>
                <CollectionsWrapper collections={collections} page="home" />
            </div>
        </Suspense>
    );
}
