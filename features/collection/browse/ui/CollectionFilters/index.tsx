'use client';

import { useState, type ReactNode } from 'react';
import { Badge, Button } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { SearchField } from '@/shared/ui/SearchField';
import { SortSelect } from '@/shared/ui/SortSelect';
import type { CollectionSort } from '@/entities/collection/model/types';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const SORTS = ['popular', 'newest', 'old'] as const;

type CollectionFiltersProps = {
    sort: CollectionSort;
    onSortChange: (value: CollectionSort) => void;
    query?: string;
    onQueryChange?: (value: string) => void;
    /** Extra controls rendered before search/sort (e.g. category chips). */
    children?: ReactNode;
    /** Content centered between the controls on wide screens (e.g. profile stats). */
    center?: ReactNode;
    /** Phones: only the search shows; the rest opens with a "Filters" button. */
    collapsible?: boolean;
    /** Filters in effect, shown on the "Filters" button. */
    activeFilters?: number;
};

export function CollectionFilters({
    sort,
    onSortChange,
    query,
    onQueryChange,
    children,
    center,
    collapsible = false,
    activeFilters = 0,
}: CollectionFiltersProps) {
    const t = useTranslations('collectionFilters');
    const sortOptions = SORTS.map((value) => ({ value, label: t(`sorts.${value}`) }));
    const [expanded, setExpanded] = useState(false);

    const className = [
        styles.filters,
        collapsible ? styles.collapsible : '',
        expanded ? styles.expanded : '',
    ].join(' ');

    return (
        <div className={className}>
            {children && <div className={styles.primary}>{children}</div>}
            {center && <div className={styles.center}>{center}</div>}

            <div className={styles.secondary}>
                {onQueryChange && (
                    <SearchField
                        value={query ?? ''}
                        onChange={onQueryChange}
                        placeholder={t('search')}
                    />
                )}
                <div className={styles.sort}>
                    <SortSelect value={sort} options={sortOptions} onChange={onSortChange} />
                </div>
                {collapsible && (
                    <Badge badgeContent={activeFilters} color="primary" className={styles.toggle}>
                        <Button
                            variant={expanded ? 'contained' : 'outlined'}
                            startIcon={<TuneIcon />}
                            onClick={() => setExpanded((value) => !value)}
                            aria-expanded={expanded}
                        >
                            {t('filters')}
                        </Button>
                    </Badge>
                )}
            </div>
        </div>
    );
}
