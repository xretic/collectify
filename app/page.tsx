'use client';

import CollectionField from '@/components/CollectionField';
import { useUser } from '@/context/UserProvider';
import { PAGE_SIZE } from '@/lib/constans';
import { useUIStore } from '@/stores/uiStore';
import { Alert, Avatar, Button, IconButton, Tooltip } from '@mui/material';
import { Suspense, useEffect, useState } from 'react';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export default function HomePage() {
    const { user, loading } = useUser();

    const [collections, setCollections] = useState<any[]>([]);
    const [pagination, setPagination] = useState(0);
    const [sortedBy, setSortedBy] = useState('newest');
    const [category, setCategory] = useState('');
    const [pageIsEmpty, setPageIsEmpty] = useState(false);
    const { startLoading, stopLoading, loadingCount } = useUIStore();

    useEffect(() => {
        const loadCollections = async () => {
            startLoading();

            const userPrompt = user ? `&userId=${user.id}` : '';
            const categoryPrompt = category !== '' ? `&category=${category}` : '';

            const response = await fetch(
                `/api/collections/search/?sortedBy=${sortedBy}&skip=${pagination * PAGE_SIZE}` +
                    categoryPrompt +
                    userPrompt,
            );

            switch (response.status) {
                case 404:
                    setPagination(pagination - PAGE_SIZE);
                    setPageIsEmpty(true);
                    setTimeout(() => setPageIsEmpty(false), 2000);
                    break;

                case 200:
                    const data = await response.json();

                    setCollections([...data.data]);
                    stopLoading();
                    break;
            }
        };

        loadCollections();
    }, [user, pagination, sortedBy, category]);

    if (loading) return null;

    return (
        <Suspense>
            <div>
                {pageIsEmpty && (
                    <div className={`toast ${pageIsEmpty ? 'show' : ''}`}>
                        <Alert severity="warning" variant="filled">
                            Next page is empty.
                        </Alert>
                    </div>
                )}
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
                    <Button variant="contained" sx={{ borderRadius: 5 }}>
                        All
                    </Button>
                </div>
                <div className="collections-wrapper">
                    {collections.length > 0 ? (
                        collections.map((x) => (
                            <CollectionField
                                key={x.id}
                                id={x.id}
                                author={x.author}
                                authorId={x.authorId}
                                authorAvatarUrl={x.authorAvatarUrl}
                                bannerUrl={x.bannerUrl}
                                name={x.name}
                                category={x.category}
                                likes={x.likes}
                                addedToFavorite={x.addedToFavorite}
                                items={x.items}
                            />
                        ))
                    ) : (
                        <div className="nothing-is-here">We found nothing.</div>
                    )}
                </div>

                <div className="pagination-wrapper">
                    <Tooltip title="Previous page">
                        <IconButton
                            disabled={pagination === 0}
                            type="button"
                            onClick={() => setPagination(pagination - 1)}
                            sx={{ p: '6px' }}
                            aria-label="search"
                        >
                            <KeyboardArrowLeftIcon sx={{ color: '#afafaf' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Next page">
                        <IconButton
                            onClick={() => setPagination(pagination + 1)}
                            type="button"
                            disabled={collections.length === 0}
                            sx={{ p: '6px' }}
                            aria-label="search"
                        >
                            <KeyboardArrowRightIcon sx={{ color: '#afafaf' }} />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
        </Suspense>
    );
}
