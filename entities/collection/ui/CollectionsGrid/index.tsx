'use client';

import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PAGE_SIZE } from '@/shared/lib/constants';
import { useGridMetrics } from '@/shared/lib/hooks/useGridMetrics';
import type { CollectionCard as CollectionCardData } from '../../model/types';
import { CollectionCard } from '../CollectionCard';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Card height under the 16:10 banner (title, author, stats); only a first guess, rows are measured. */
const CARD_BODY_HEIGHT = 134;

/**
 * Collection cards in fluid columns. Only the rows near the viewport are mounted, so a long
 * feed stays light; the stylesheet still decides how many cards fit in a row.
 */
export function CollectionsGrid({ collections }: { collections: CollectionCardData[] }) {
    const t = useTranslations('collectionsGrid');
    const [gridRef, grid] = useGridMetrics();
    const columns = grid?.columns ?? 1;

    const virtualizer = useWindowVirtualizer({
        count: Math.ceil(collections.length / columns),
        estimateSize: () => Math.round(((grid?.columnWidth ?? 0) * 10) / 16) + CARD_BODY_HEIGHT,
        // Rows hold different cards once the column count changes: measure them again.
        getItemKey: (index) => `${columns}:${index}`,
        gap: grid?.rowGap ?? 0,
        overscan: 2,
        scrollMargin: grid?.top ?? 0,
        enabled: grid !== null,
    });

    if (collections.length === 0) {
        return <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />;
    }

    if (!grid) {
        // Server HTML and the hydration render: plain cards, so the page works before scripts run.
        return (
            <div ref={gridRef} className={styles.grid}>
                {collections.slice(0, PAGE_SIZE).map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                ))}
            </div>
        );
    }

    return (
        <div
            ref={gridRef}
            className={`${styles.grid} ${styles.virtual}`}
            // The virtualizer computes the height and row offsets on every scroll.
            style={{ height: virtualizer.getTotalSize() }}
        >
            {virtualizer.getVirtualItems().map((row) => (
                <div
                    key={row.key}
                    ref={virtualizer.measureElement}
                    data-index={row.index}
                    className={styles.row}
                    style={{ transform: `translateY(${row.start - grid.top}px)` }}
                >
                    {collections
                        .slice(row.index * columns, (row.index + 1) * columns)
                        .map((collection) => (
                            <CollectionCard key={collection.id} collection={collection} />
                        ))}
                </div>
            ))}
        </div>
    );
}
