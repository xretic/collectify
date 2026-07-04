'use client';

import { useUser } from '@/app/providers/UserProvider';
import { CATEGORIES, PAGE_SIZE } from '@/shared/lib/constants';
import { useUIStore } from '@/shared/model/uiStore';
import { Avatar, Button } from '@mui/material';
import { Suspense, useMemo, useState } from 'react';
import CollectionSearchBar from '@/features/collection/search/ui/CollectionSearchBar';
import { useCollectionSearchStore } from '@/features/collection/search/model/collectionSearchStore';
import { usePaginationStore } from '@/shared/model/paginationStore';
import CollectionsWrapper from '@/entities/collection/ui/CollectionsWrapper';
import SortBy from '@/shared/ui/SortBy';
import styles from '@/app/(home)/home.module.css';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import HomePageSkeleton from '@/shared/ui/skeletons/HomePageSkeleton';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';

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
        queryKey: [collectionQueryKeys.search[0], params],
        enabled: !loading,
        staleTime: 30_000,
        queryFn: () => collectionApi.search({ ...params, privateOnly: false }),
    });

    const collections = data ?? [];

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
