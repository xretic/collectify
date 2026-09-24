'use client';

import { Avatar } from '@mui/material';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { useCollectionList } from '@/entities/collection/model/useCollectionList';
import { CollectionsGrid } from '@/entities/collection/ui/CollectionsGrid';
import { CollectionsGridSkeleton } from '@/entities/collection/ui/CollectionsGridSkeleton';
import { useCollectionListParams } from '@/features/collection/browse/model/useCollectionListParams';
import { CollectionFilters } from '@/features/collection/browse/ui/CollectionFilters';
import { CategoryChips } from '@/features/collection/browse/ui/CategoryChips';
import { Pagination } from '@/shared/ui/Pagination';
import styles from './HomePage.module.css';

export default function HomePage() {
    const { user, loading } = useSessionUser();
    const list = useCollectionListParams();

    const { data, isPending } = useCollectionList(
        { sort: list.sort, page: list.page, category: list.category, query: list.query },
        // Wait for the session: signed-in users get followed authors first.
        !loading,
    );

    return (
        <section className={styles.page}>
            <h1 className={styles.greeting}>
                {user ? (
                    <>
                        <Avatar
                            src={user.avatarUrl}
                            alt={user.username}
                            className={styles.avatar}
                        />
                        Welcome back, {user.username}!
                    </>
                ) : (
                    'Discover collections'
                )}
            </h1>

            <CollectionFilters
                sort={list.sort}
                onSortChange={list.setSort}
                query={list.queryInput}
                onQueryChange={list.setQueryInput}
            >
                <CategoryChips value={list.category} onChange={list.setCategory} />
            </CollectionFilters>

            {isPending || !data ? (
                <CollectionsGridSkeleton />
            ) : (
                <CollectionsGrid collections={data.data} />
            )}

            <Pagination page={list.page} hasMore={data?.hasMore ?? false} onChange={list.setPage} />
        </section>
    );
}
