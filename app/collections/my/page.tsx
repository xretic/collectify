'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, InputAdornment, TextField } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

import { useUser } from '@/context/UserProvider';
import { api } from '@/lib/api';
import { CATEGORIES, PAGE_SIZE } from '@/lib/constans';
import { useDebounce } from '@/lib/useDebounce';
import { usePaginationStore } from '@/stores/paginationStore';
import { useUIStore } from '@/stores/uiStore';
import {
    useMyCollectionsFiltersStore,
    MyCollectionsVisibility,
} from '@/stores/myCollectionsFiltersStore';
import { Loader } from '@/components/ui/Loader';
import SortBy from '@/components/ui/SortBy';
import CollectionsWrapper from '@/components/features/collections/CollectionsWrapper';
import { CollectionFieldProps } from '@/types/CollectionField';
import AddIcon from '@mui/icons-material/Add';
import styles from './my.module.css';

export default function MyCollectionsPage() {
    const router = useRouter();
    const { user, loading } = useUser();
    const { sortedBy } = useUIStore();
    const { myCollectionsPagination, setMyCollectionsPagination } = usePaginationStore();

    const { visibility, category, query, setVisibility, setCategory, setQuery } =
        useMyCollectionsFiltersStore();

    const debouncedQuery = useDebounce(query, 400);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/');
        }
    }, [loading, user, router]);

    const handleVisibilityChange = (value: MyCollectionsVisibility) => {
        setVisibility(value);
        setMyCollectionsPagination(0);
    };

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        setMyCollectionsPagination(0);
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setMyCollectionsPagination(0);
    };

    useEffect(() => {
        setMyCollectionsPagination(0);
    }, [sortedBy, setMyCollectionsPagination]);

    const params = useMemo(() => {
        return {
            authorId: user?.id ?? null,
            sortedBy,
            skip: myCollectionsPagination * PAGE_SIZE,
            privateOnly: visibility === 'private',
            category,
            query: debouncedQuery.trim(),
        };
    }, [user?.id, sortedBy, myCollectionsPagination, visibility, category, debouncedQuery]);

    const { data, isFetching } = useQuery({
        queryKey: ['my-collections-search', params],
        enabled: !loading && params.authorId != null,
        staleTime: 10_000,
        queryFn: async () => {
            const searchParams = new URLSearchParams({
                authorId: String(params.authorId),
                sortedBy: String(params.sortedBy),
                skip: String(params.skip),
                privateOnly: String(params.privateOnly),
            });

            if (params.category) {
                searchParams.set('category', params.category);
            }

            if (params.query) {
                searchParams.set('query', params.query);
            }

            return api
                .get(`api/collections/search/?${searchParams.toString()}`)
                .json<{ data: CollectionFieldProps[] }>();
        },
    });

    if (loading || !user) {
        return null;
    }

    if (isFetching) {
        return <Loader />;
    }

    const collections = data?.data ?? [];

    return (
        <section className={styles.page}>
            <div className={styles.hero}>
                <div>
                    <h1 className={styles.title}>My collections</h1>
                    <p className={styles.subtitle}>
                        Browse and manage your own collections by visibility, category, and search.
                    </p>
                </div>

                <Button
                    variant="contained"
                    onClick={() => router.push('/collections/create')}
                    sx={{ borderRadius: 3, textTransform: 'none', height: 40 }}
                >
                    <AddIcon sx={{ width: 18, height: 18, marginRight: 0.5 }} />
                    Create collection
                </Button>
            </div>

            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <div className={styles.panelTitle}>
                        <FilterListIcon sx={{ width: 18, height: 18 }} />
                        Filters
                    </div>

                    <SortBy disabled={collections.length === 0} />
                </div>

                <div className={styles.controls}>
                    <div className={styles.block}>
                        <span className={styles.label}>Visibility</span>

                        <div className={styles.row}>
                            <Button
                                onClick={() => handleVisibilityChange('public')}
                                variant={visibility === 'public' ? 'contained' : 'outlined'}
                                sx={{ borderRadius: 3, textTransform: 'none', height: 38 }}
                            >
                                <PublicIcon sx={{ width: 18, height: 18 }} />
                                <span className={styles.buttonText}>Public</span>
                            </Button>

                            <Button
                                onClick={() => handleVisibilityChange('private')}
                                variant={visibility === 'private' ? 'contained' : 'outlined'}
                                sx={{ borderRadius: 3, textTransform: 'none', height: 38 }}
                            >
                                <LockIcon sx={{ width: 18, height: 18 }} />
                                <span className={styles.buttonText}>Private</span>
                            </Button>
                        </div>
                    </div>

                    <div className={styles.block}>
                        <span className={styles.label}>Search</span>

                        <TextField
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Search your collections"
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--text-color)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--text-color)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--accent)',
                                    },
                                    '& input': {
                                        color: 'var(--text-color)',
                                        WebkitTextFillColor: 'var(--text-color)',
                                    },
                                },
                            }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'var(--text-color)' }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </div>

                    <div className={styles.block}>
                        <span className={styles.label}>Category</span>

                        <div className={styles.categories}>
                            <Button
                                onClick={() => handleCategoryChange('')}
                                variant={category === '' ? 'contained' : 'outlined'}
                                sx={{ borderRadius: 6, textTransform: 'none', height: 36 }}
                            >
                                All
                            </Button>

                            {CATEGORIES.map((item) => (
                                <Button
                                    key={item}
                                    onClick={() => handleCategoryChange(item)}
                                    variant={category === item ? 'contained' : 'outlined'}
                                    sx={{ borderRadius: 6, textTransform: 'none', height: 36 }}
                                >
                                    {item}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.collections}>
                <CollectionsWrapper collections={collections} page="myCollections" />
            </div>
        </section>
    );
}
