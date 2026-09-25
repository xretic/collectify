'use client';

import { useQuery } from '@tanstack/react-query';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { categoryApi } from '@/entities/category/api/categoryApi';
import { categoryQueryKeys } from '@/entities/category/model/queryKeys';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './index.module.css';

type InterestPickerProps = {
    value: number[];
    onChange: (categoryIds: number[]) => void;
};

/** Category tiles with a cover from a random popular collection of that category. */
export function InterestPicker({ value, onChange }: InterestPickerProps) {
    const showcase = useQuery({
        queryKey: [...categoryQueryKeys.all, 'showcase'],
        queryFn: categoryApi.showcase,
        staleTime: Infinity,
    });

    if (showcase.isPending) return <Spinner />;

    const toggle = (categoryId: number) =>
        onChange(
            value.includes(categoryId)
                ? value.filter((id) => id !== categoryId)
                : [...value, categoryId],
        );

    return (
        <div className={styles.grid}>
            {showcase.data?.map((category) => {
                const selected = value.includes(category.id);

                return (
                    <button
                        key={category.id}
                        type="button"
                        className={`${styles.tile} ${selected ? styles.selected : ''}`}
                        onClick={() => toggle(category.id)}
                        aria-pressed={selected}
                    >
                        {category.coverUrl ? (
                            <img className={styles.cover} src={category.coverUrl} alt="" />
                        ) : (
                            <span className={`${styles.cover} ${styles.placeholder}`} />
                        )}
                        <span className={styles.shade} />
                        <span className={styles.name}>{category.name}</span>
                        {selected && <CheckCircleIcon className={styles.check} />}
                    </button>
                );
            })}
        </div>
    );
}
