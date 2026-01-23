'use client';

import CollectionField from '@/components/CollectionField';
import { useUser } from '@/context/UserProvider';
import { CATEGORIES, PAGE_SIZE } from '@/lib/constans';
import { useUIStore } from '@/stores/uiStore';
import {
    Avatar,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Tooltip,
} from '@mui/material';
import { Suspense, useEffect, useState } from 'react';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export default function HomePage() {
    const { user, loading } = useUser();

    const [collections, setCollections] = useState<any[]>([]);
    const [pagination, setPagination] = useState(0);
    const [sortedBy, setSortedBy] = useState('popular');
    const [category, setCategory] = useState('');
    const { startLoading, stopLoading } = useUIStore();

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

            if (response.status === 200) {
                const data = await response.json();

                setCollections([...data.data]);
            }

            stopLoading();
        };

        loadCollections();
    }, [user, pagination, sortedBy, category]);

    if (loading) return null;

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

                    <FormControl
                        sx={{
                            ml: { xs: 0, sm: 'auto' },
                            mt: { xs: 2, sm: 0 },
                            width: { xs: '100%', sm: '100%', lg: 110, xl: 110 },
                        }}
                    >
                        <InputLabel id="sort-select-label">Sorted by</InputLabel>

                        <Select
                            labelId="sort-select-label"
                            id="sort-select"
                            value={sortedBy}
                            label="Sorted by"
                            sx={{
                                height: 40,
                                borderRadius: 5,
                            }}
                        >
                            <MenuItem value="popular" onClick={() => setSortedBy('popular')}>
                                Popular
                            </MenuItem>
                            <MenuItem value="newest" onClick={() => setSortedBy('newest')}>
                                Newest
                            </MenuItem>
                            <MenuItem value="old" onClick={() => setSortedBy('old')}>
                                Oldest
                            </MenuItem>
                        </Select>
                    </FormControl>
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
                            disabled={collections.length === 0 || collections.length < PAGE_SIZE}
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
