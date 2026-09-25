'use client';

import { EmptyState } from '@/shared/ui/EmptyState';
import type { CollectionCard as CollectionCardData } from '../../model/types';
import { CollectionCard } from '../CollectionCard';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

export function CollectionsGrid({ collections }: { collections: CollectionCardData[] }) {
    const t = useTranslations('collectionsGrid');

    if (collections.length === 0) {
        return <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />;
    }

    return (
        <div className={styles.grid}>
            {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
            ))}
        </div>
    );
}
