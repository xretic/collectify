'use client';

import { useUser } from '@/context/UserProvider';
import { CATEGORIES, PAGE_SIZE } from '@/lib/constans';
import { useUIStore } from '@/stores/uiStore';
import { Avatar, Button } from '@mui/material';
import { Suspense, useEffect, useState } from 'react';
import CollectionSearchBar from '@/components/CollectionSearchBar/CollectionSearchBar';
import { useCollectionSearchStore } from '@/stores/collectionSearchStore';
import { usePaginationStore } from '@/stores/paginationStore';
import CollectionsWrapper from '@/components/CollectionsWrapper/CollectionsWrapper';
import SortBy from '@/components/SortBy/SortBy';
import styles from './home.module.css';

export default function HomePage() {
    const { user, loading } = useUser();

    const [collections, setCollections] = useState<any[]>([]);
    const [category, setCategory] = useState('');

    const { query } = useCollectionSearchStore();
    const { startLoading, stopLoading, sortedBy } = useUIStore();
    const { homePagination } = usePaginationStore();

    const loadCollections = async () => {
        startLoading();

        const userPrompt = user ? `&userId=${user.id}` : '';
        const categoryPrompt = category !== '' ? `&category=${category}` : '';
        const queryPrompt = query !== '' ? `&query=${query}` : '';

        const response = await fetch(
            `/api/collections/search/?sortedBy=${sortedBy}&skip=${homePagination * PAGE_SIZE}` +
                categoryPrompt +
                userPrompt +
                queryPrompt,
        );

        if (response.status === 200) {
            const data = await response.json();

            setCollections([...data.data]);
        }

        stopLoading();
    };

    useEffect(() => {
        if (loading) return;

        const handler = setTimeout(loadCollections, 400);
        return () => clearTimeout(handler);
    }, [loading, homePagination, sortedBy, category, query]);

    if (loading) return null;

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
