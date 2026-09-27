'use client';

import Link from 'next/link';
import { Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { CategoryRef } from '@/entities/category/model/types';
import { useCategoryName } from '@/entities/category/model/useCategoryName';
import { useRelatedCollections } from '@/entities/collection/model/useRelatedCollections';
import { CollectionsGrid } from '@/entities/collection/ui/CollectionsGrid';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type RelatedCollectionsProps = {
    collectionId: number;
    category: CategoryRef;
};

/** "More like this" at the end of a collection, so the page is never a dead end. */
export function RelatedCollections({ collectionId, category }: RelatedCollectionsProps) {
    const t = useTranslations('collection.related');
    const categoryName = useCategoryName();
    const { data: collections = [] } = useRelatedCollections(collectionId);

    if (collections.length === 0) return null;

    return (
        <section className={styles.section} aria-labelledby="related-title">
            <header className={styles.header}>
                <h2 id="related-title" className={styles.title}>
                    {t('title')}
                </h2>
                <Button
                    component={Link}
                    href={`/?category=${category.slug}`}
                    endIcon={<ArrowForwardIcon />}
                >
                    {t('more', { category: categoryName(category) })}
                </Button>
            </header>

            <CollectionsGrid collections={collections} />
        </section>
    );
}
