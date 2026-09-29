'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@mui/material';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { useCollectionFeed } from '@/entities/collection/model/useCollectionFeed';
import { useRecommendations } from '@/entities/collection/model/useRecommendations';
import { CollectionsGrid } from '@/entities/collection/ui/CollectionsGrid';
import { CollectionsGridSkeleton } from '@/entities/collection/ui/CollectionsGridSkeleton';
import { CategoryMenu } from '@/entities/category/ui/CategoryMenu';
import { useCategories } from '@/entities/category/model/useCategories';
import { useCollectionListParams } from '@/features/collection/browse/model/useCollectionListParams';
import { CollectionFilters } from '@/features/collection/browse/ui/CollectionFilters';
import { TagFilter } from '@/features/tag/filter/ui/TagFilter';
import { useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { PeopleYouMayKnow } from '@/widgets/people-you-may-know/ui/PeopleYouMayKnow';
import { GuestHero } from '@/widgets/guest-hero/ui/GuestHero';
import { resolveFeed } from '../lib/feed';
import { FeedTabs, type Feed } from './FeedTabs';
import styles from './HomePage.module.css';
import { useTranslations } from 'next-intl';

export default function HomePage() {
    const t = useTranslations('home');
    const tc = useTranslations('common');
    // Loaded on the server (root layout), so the first render already knows the user.
    const { user, loading } = useSessionUser();
    const searchParams = useSearchParams();
    const list = useCollectionListParams();
    const feed = resolveFeed((key) => searchParams.get(key), Boolean(user));
    const { bySlug } = useCategories();
    const categoryId = list.category ? (bySlug.get(list.category)?.id ?? null) : null;

    const explore = useCollectionFeed(
        { sort: list.sort, category: list.category, tags: list.tags, query: list.query },
        // Wait for the session: signed-in users get followed authors first.
        !loading && feed.kind === 'explore',
    );

    const recommended = useRecommendations(
        feed.kind === 'board' ? feed.boardId : undefined,
        Boolean(user) && feed.kind !== 'explore',
    );

    const active = feed.kind === 'explore' ? explore : recommended;

    const loadMoreRef = useInfiniteScroll({
        hasMore: active.hasNextPage,
        loading: active.isFetchingNextPage,
        onLoadMore: active.fetchNextPage,
    });

    const selectFeed = (next: Feed) =>
        list.update({
            feed: next.kind === 'explore' ? 'explore' : undefined,
            board: next.kind === 'board' ? next.boardId : undefined,
            category: undefined,
            tag: undefined,
            q: undefined,
            sort: undefined,
        });

    // First-time visitors see what Collectify is before the feed; filtering means they got it.
    const landing = !user && !feed.filtered;
    const activeFilters =
        (list.category ? 1 : 0) + list.tags.length + (list.sort === 'popular' ? 0 : 1);

    return (
        <section className={styles.page}>
            {landing && <GuestHero />}

            {user ? (
                <FeedTabs value={feed} onChange={selectFeed} />
            ) : landing ? (
                <h2 className={styles.sectionTitle}>{t('popularNow')}</h2>
            ) : (
                <h1 className={styles.greeting}>{t('discover')}</h1>
            )}

            <div className={styles.layout} id="feed">
                <div className={styles.feed}>
                    {feed.kind === 'explore' && (
                        <CollectionFilters
                            sort={list.sort}
                            onSortChange={list.setSort}
                            query={list.queryInput}
                            onQueryChange={list.setQueryInput}
                            collapsible
                            activeFilters={activeFilters}
                        >
                            <div className={styles.filters}>
                                <CategoryMenu value={list.category} onChange={list.setCategory} />
                                <TagFilter
                                    categoryId={categoryId}
                                    value={list.tags}
                                    onChange={list.setTags}
                                />
                            </div>
                        </CollectionFilters>
                    )}

                    {active.isPending || loading ? (
                        <CollectionsGridSkeleton />
                    ) : active.collections.length === 0 && feed.kind !== 'explore' ? (
                        <EmptyState
                            title={t('emptyTitle')}
                            description={feed.kind === 'board' ? t('emptyBoard') : t('emptyForYou')}
                        />
                    ) : (
                        <CollectionsGrid collections={active.collections} />
                    )}

                    {active.hasNextPage && (
                        <div ref={loadMoreRef} className={styles.more}>
                            {active.isFetchingNextPage ? (
                                <Spinner />
                            ) : (
                                <Button onClick={() => active.fetchNextPage()}>
                                    {tc('loadMore')}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {user && (
                    <aside className={styles.aside}>
                        <PeopleYouMayKnow />
                    </aside>
                )}
            </div>
        </section>
    );
}
