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
import { FeedTabs, type Feed } from './FeedTabs';
import styles from './HomePage.module.css';
import { useTranslations } from 'next-intl';

/** Feed from the URL: signed-in users land on "For you"; filters and tags imply "Explore". */
function useFeed(signedIn: boolean): Feed {
    const searchParams = useSearchParams();
    const board = Number(searchParams.get('board'));

    if (!signedIn) return { kind: 'explore' };
    if (Number.isInteger(board) && board > 0) return { kind: 'board', boardId: board };

    const filtered = ['category', 'tag', 'q', 'sort'].some((key) => searchParams.has(key));
    if (searchParams.get('feed') === 'explore' || filtered) return { kind: 'explore' };

    return { kind: 'for-you' };
}

export default function HomePage() {
    const t = useTranslations('home');
    const tc = useTranslations('common');
    const { user, loading } = useSessionUser();
    const list = useCollectionListParams();
    const feed = useFeed(Boolean(user));
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

    return (
        <section className={styles.page}>
            {user ? (
                <FeedTabs value={feed} onChange={selectFeed} />
            ) : (
                <h1 className={styles.greeting}>{t('discover')}</h1>
            )}

            <div className={styles.layout}>
                <div className={styles.feed}>
                    {feed.kind === 'explore' && (
                        <CollectionFilters
                            sort={list.sort}
                            onSortChange={list.setSort}
                            query={list.queryInput}
                            onQueryChange={list.setQueryInput}
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
