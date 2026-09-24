import type { ReactNode } from 'react';
import { SearchField } from '@/shared/ui/SearchField';
import { SortSelect } from '@/shared/ui/SortSelect';
import type { CollectionSort } from '@/entities/collection/model/types';
import styles from './index.module.css';

const SORT_OPTIONS = [
    { value: 'popular', label: 'Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'old', label: 'Oldest' },
] as const;

type CollectionFiltersProps = {
    sort: CollectionSort;
    onSortChange: (value: CollectionSort) => void;
    query?: string;
    onQueryChange?: (value: string) => void;
    /** Extra controls rendered before search/sort (e.g. category chips). */
    children?: ReactNode;
    /** Content centered between the controls on wide screens (e.g. profile stats). */
    center?: ReactNode;
};

export function CollectionFilters({
    sort,
    onSortChange,
    query,
    onQueryChange,
    children,
    center,
}: CollectionFiltersProps) {
    return (
        <div className={styles.filters}>
            {children && <div className={styles.primary}>{children}</div>}
            {center && <div className={styles.center}>{center}</div>}

            <div className={styles.secondary}>
                {onQueryChange && (
                    <SearchField
                        value={query ?? ''}
                        onChange={onQueryChange}
                        placeholder="Search collections"
                    />
                )}
                <SortSelect value={sort} options={SORT_OPTIONS} onChange={onSortChange} />
            </div>
        </div>
    );
}
