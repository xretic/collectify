'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import LockIcon from '@mui/icons-material/Lock';
import { useCollectionList } from '@/entities/collection/model/useCollectionList';
import { CollectionsGrid } from '@/entities/collection/ui/CollectionsGrid';
import { CollectionsGridSkeleton } from '@/entities/collection/ui/CollectionsGridSkeleton';
import { useCollectionListParams } from '@/features/collection/browse/model/useCollectionListParams';
import { CollectionFilters } from '@/features/collection/browse/ui/CollectionFilters';
import { BoardTabs } from '@/features/board/ui/BoardTabs';
import { Pagination } from '@/shared/ui/Pagination';
import { TabIndicator } from '@/shared/ui/TabIndicator';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';
import { profileListParams } from '../../lib/listParams';

const TABS = [
    { value: 'created', icon: <AutoAwesomeMosaicIcon fontSize="small" /> },
    { value: 'favorites', icon: <BookmarksIcon fontSize="small" /> },
    { value: 'private', icon: <LockIcon fontSize="small" /> },
] as const;

type ProfileCollectionsProps = {
    authorId: number;
    /** The profile's follow stats; shown in the filter row on desktop (the header shows them on phones). */
    stats?: ReactNode;
    /** The viewer's own profile: shows favorites and private tabs. */
    own?: boolean;
};

export function ProfileCollections({ authorId, stats, own = false }: ProfileCollectionsProps) {
    const t = useTranslations('profile.tabs');
    const list = useCollectionListParams();
    const searchParams = useSearchParams();
    const { tab, board, params } = profileListParams((key) => searchParams.get(key), authorId, own);

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
                            <button
                                key={item.value}
                                type="button"
                                role="tab"
                                aria-selected={tab === item.value}
                                className={`${styles.tab} ${tab === item.value ? styles.active : ''}`}
                                onClick={() =>
                                    list.update({
                                        tab: item.value === 'created' ? undefined : item.value,
                                        board: undefined,
                                    })
                                }
                            >
                                {item.icon}
                                <span className={styles.tabLabel}>{t(item.value)}</span>
                            </button>
                        ))}
                        <TabIndicator />
                    </div>
                ) : (
                    stats && <div data-desktop-only>{stats}</div>
                )}
            </CollectionFilters>

            {tab === 'favorites' && (
                <BoardTabs value={board} onChange={(value) => list.update({ board: value })} />
            )}

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
