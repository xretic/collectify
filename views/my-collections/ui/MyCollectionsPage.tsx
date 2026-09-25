'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { useCollectionList } from '@/entities/collection/model/useCollectionList';
import { CollectionsGrid } from '@/entities/collection/ui/CollectionsGrid';
import { CollectionsGridSkeleton } from '@/entities/collection/ui/CollectionsGridSkeleton';
import { useCollectionListParams } from '@/features/collection/browse/model/useCollectionListParams';
import { CollectionFilters } from '@/features/collection/browse/ui/CollectionFilters';
import { CategoryMenu } from '@/entities/category/ui/CategoryMenu';
import { useCategories } from '@/entities/category/model/useCategories';
import { TagFilter } from '@/features/tag/filter/ui/TagFilter';
import { Pagination } from '@/shared/ui/Pagination';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './MyCollectionsPage.module.css';
import { useTranslations } from 'next-intl';

type Visibility = 'public' | 'private';

export default function MyCollectionsPage() {
    const t = useTranslations('myCollections');
    const tf = useTranslations('collectionForm');
    const { user, loading } = useSessionUser();
    const list = useCollectionListParams();
    const { bySlug } = useCategories();
    const categoryId = list.category ? (bySlug.get(list.category)?.id ?? null) : null;
    const visibility: Visibility =
        useSearchParams().get('visibility') === 'private' ? 'private' : 'public';

    const { data, isPending } = useCollectionList(
        {
            sort: list.sort,
            page: list.page,
            category: list.category,
            tags: list.tags,
            query: list.query,
            authorId: user?.id,
            visibility,
        },
        Boolean(user),
    );

    if (loading || !user) return <Spinner variant="page" />;

    return (
        <section className={styles.page}>
            <div className={styles.hero}>
                <div>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <p className={styles.subtitle}>{t('subtitle')}</p>
                </div>

                <Button
                    variant="contained"
                    component={Link}
                    href="/collections/create"
                    startIcon={<AddIcon />}
                >
                    {t('create')}
                </Button>
            </div>

            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <span className={styles.panelTitle}>
                        <FilterListIcon fontSize="small" />
                        {t('filters')}
                    </span>
                </div>

                <div className={styles.controls}>
                    <div className={styles.block}>
                        <span className={styles.label}>{tf('visibility')}</span>
                        <div className={styles.row}>
                            {(['public', 'private'] as const).map((value) => (
                                <Button
                                    key={value}
                                    variant={visibility === value ? 'contained' : 'outlined'}
                                    onClick={() =>
                                        list.update({
                                            visibility: value === 'public' ? undefined : value,
                                        })
                                    }
                                >
                                    {tf(value)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <CollectionFilters
                        sort={list.sort}
                        onSortChange={list.setSort}
                        query={list.queryInput}
                        onQueryChange={list.setQueryInput}
                    >
                        <div className={styles.controls}>
                            <div className={styles.block}>
                                <span className={styles.label}>{t('category')}</span>
                                <CategoryMenu value={list.category} onChange={list.setCategory} />
                            </div>

                            <div className={styles.block}>
                                <span className={styles.label}>{t('tags')}</span>
                                <div className={styles.row}>
                                    <TagFilter
                                        categoryId={categoryId}
                                        value={list.tags}
                                        onChange={list.setTags}
                                    />
                                </div>
                            </div>
                        </div>
                    </CollectionFilters>
                </div>
            </div>

            {isPending || !data ? (
                <CollectionsGridSkeleton />
            ) : (
                <CollectionsGrid collections={data.data} />
            )}

            <Pagination page={list.page} hasMore={data?.hasMore ?? false} onChange={list.setPage} />
        </section>
    );
}
