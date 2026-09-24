'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@mui/material';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import LockIcon from '@mui/icons-material/Lock';
import type { CollectionListParams } from '@/entities/collection/model/types';
import { useCollectionList } from '@/entities/collection/model/useCollectionList';
import { CollectionsGrid } from '@/entities/collection/ui/CollectionsGrid';
import { CollectionsGridSkeleton } from '@/entities/collection/ui/CollectionsGridSkeleton';
import { useCollectionListParams } from '@/features/collection/browse/model/useCollectionListParams';
import { CollectionFilters } from '@/features/collection/browse/ui/CollectionFilters';
import { Pagination } from '@/shared/ui/Pagination';
import styles from './index.module.css';

type Tab = 'created' | 'favorites' | 'private';

const TABS = [
    { value: 'created', label: 'Created', icon: <AutoAwesomeMosaicIcon fontSize="small" /> },
    { value: 'favorites', label: 'Favorites', icon: <BookmarksIcon fontSize="small" /> },
    { value: 'private', label: 'Private', icon: <LockIcon fontSize="small" /> },
] as const;

type ProfileCollectionsProps = {
    authorId: number;
    /** The profile's follow stats; shown in the filter row on desktop (the header shows them on phones). */
    stats?: ReactNode;
    /** The viewer's own profile: shows favorites and private tabs. */
    own?: boolean;
};

export function ProfileCollections({ authorId, stats, own = false }: ProfileCollectionsProps) {
    const list = useCollectionListParams();
    const tabParam = useSearchParams().get('tab');
    const tab: Tab =
        own && (tabParam === 'favorites' || tabParam === 'private') ? tabParam : 'created';

    const params: CollectionListParams = {
        sort: list.sort,
        page: list.page,
        query: list.query,
        ...(tab === 'favorites'
            ? { favorites: true }
            : { authorId, visibility: tab === 'private' ? 'private' : 'public' }),
    };

    const { data, isPending } = useCollectionList(params);

    return (
        <section className={styles.section}>
            <CollectionFilters
                sort={list.sort}
                onSortChange={list.setSort}
                query={list.queryInput}
                onQueryChange={list.setQueryInput}
                // Own profile: tabs on the left, stats centered. Public profile: stats on the left.
                center={own && stats ? <div data-desktop-only>{stats}</div> : undefined}
            >
                {own ? (
                    <div className={styles.tabs} role="tablist">
                        {TABS.map((item) => (
                            <Button
                                key={item.value}
                                role="tab"
                                aria-selected={tab === item.value}
                                variant={tab === item.value ? 'contained' : 'outlined'}
                                startIcon={item.icon}
                                onClick={() =>
                                    list.update({
                                        tab: item.value === 'created' ? undefined : item.value,
                                    })
                                }
                            >
                                <span className={styles.tabLabel}>{item.label}</span>
                            </Button>
                        ))}
                    </div>
                ) : (
                    stats && <div data-desktop-only>{stats}</div>
                )}
            </CollectionFilters>

            <div className={styles.divider} />

            {isPending || !data ? (
                <CollectionsGridSkeleton />
            ) : (
                <CollectionsGrid collections={data.data} />
            )}

            <Pagination page={list.page} hasMore={data?.hasMore ?? false} onChange={list.setPage} />
        </section>
    );
}
