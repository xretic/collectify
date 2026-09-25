'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { categoryApi } from '@/entities/category/api/categoryApi';
import { categoryQueryKeys } from '@/entities/category/model/queryKeys';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import styles from '../ManagementSidebar/list.module.css';
import { useTranslations } from 'next-intl';

type CategoriesListProps = {
    selectedId: number | 'new' | null;
    onSelect: (categoryId: number | 'new') => void;
};

export function CategoriesList({ selectedId, onSelect }: CategoriesListProps) {
    const t = useTranslations('management.categories');
    const categories = useQuery({
        queryKey: categoryQueryKeys.managed(),
        queryFn: categoryApi.listManaged,
    });

    return (
        <>
            <Button
                variant="outlined"
                startIcon={<AddIcon />}
                className={styles.search}
                onClick={() => onSelect('new')}
            >
                {t('new')}
            </Button>

            <div className={styles.list}>
                {categories.isPending && <Spinner />}
                {categories.data?.length === 0 && <EmptyState title={t('empty')} />}

                {categories.data?.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        className={`${styles.row} ${category.id === selectedId ? styles.rowActive : ''}`}
                        onClick={() => onSelect(category.id)}
                    >
                        <span className={styles.meta}>
                            <span className={styles.primary}>{category.name}</span>
                            <span className={styles.secondary}>
                                {t('collections', { count: category.collections })}
                                {!category.isActive && ` · ${t('archivedLower')}`}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </>
    );
}
