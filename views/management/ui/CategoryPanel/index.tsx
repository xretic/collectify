'use client';

import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/entities/category/api/categoryApi';
import { categoryQueryKeys } from '@/entities/category/model/queryKeys';
import { CategoryForm } from '@/features/category/manage/ui/CategoryForm';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { CategoryTags } from '../CategoryTags';
import styles from './index.module.css';

type CategoryPanelProps = {
    categoryId: number | 'new';
    onSelect: (categoryId: number | null) => void;
};

export function CategoryPanel({ categoryId, onSelect }: CategoryPanelProps) {
    const categories = useQuery({
        queryKey: categoryQueryKeys.managed(),
        queryFn: categoryApi.listManaged,
    });

    if (categories.isPending) return <Spinner />;

    const category =
        categoryId === 'new' ? null : categories.data?.find((row) => row.id === categoryId);

    if (category === undefined) return <EmptyState title="Category not found" />;

    return (
        <div className={styles.panel}>
            <header>
                <h2 className={styles.title}>{category ? category.name : 'New category'}</h2>
                {category && (
                    <p className={styles.hint}>
                        {category.collections} collections · /?category={category.slug}
                    </p>
                )}
            </header>

            <CategoryForm
                key={`form-${categoryId}`}
                category={category}
                onSaved={(saved) => onSelect(saved.id)}
                onDeleted={() => onSelect(null)}
            />

            {category && <CategoryTags key={`tags-${category.id}`} categoryId={category.id} />}
        </div>
    );
}
