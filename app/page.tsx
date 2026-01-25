'use client';

import { useUser } from '@/context/UserProvider';
import { CATEGORIES, PAGE_SIZE } from '@/lib/constans';
import { useUIStore } from '@/stores/uiStore';
import { Avatar, Button } from '@mui/material';
import { Suspense, useEffect, useState } from 'react';
import CollectionSearchBar from '@/components/CollectionSearchBar';
import { useCollectionSearchStore } from '@/stores/collectionSearchStore';
import { usePaginationStore } from '@/stores/paginationStore';
import CollectionsWrapper from '@/components/CollectionsWrapper';
import SortBy from '@/components/SortBy';

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

    // TODO: make visible only those collections which have more than 1 item inside

    return (
        <Suspense>
            <div className="home-page-container">
                <div>
                    <div className="home-page-title">
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

                <div className="buttons-wrapper">
                    <Button
                        onClick={() => setCategory('')}
                        variant={category === '' ? 'contained' : 'outlined'}
                        sx={{ borderRadius: 5 }}
                    >
                        All
                    </Button>

                    {CATEGORIES.map((x) => (
                        <Button
                            key={x}
                            onClick={() => setCategory(x)}
                            variant={category === x ? 'contained' : 'outlined'}
                            sx={{ borderRadius: 5 }}
                        >
                            {x}
                        </Button>
                    ))}

                    <SortBy />
                    <CollectionSearchBar />
                </div>
                <CollectionsWrapper collections={collections} page="home" />
            </div>
        </Suspense>
    );
}
