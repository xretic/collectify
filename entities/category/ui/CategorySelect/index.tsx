'use client';

import { MenuItem, TextField } from '@mui/material';
import { useCategories } from '../../model/useCategories';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type CategorySelectProps = {
    value: number | null;
    onChange: (categoryId: number) => void;
    required?: boolean;
    disabled?: boolean;
    className?: string;
};

/** Form field for choosing a collection's category. */
export function CategorySelect({
    value,
    onChange,
    required,
    disabled,
    className,
}: CategorySelectProps) {
    const t = useTranslations('categoryMenu');
    const { categories, isPending } = useCategories();

    return (
        <TextField
            select
            fullWidth
            label={t('label')}
            required={required}
            disabled={disabled || isPending}
            className={className}
            value={categories.some((category) => category.id === value) ? value : ''}
            onChange={(event) => onChange(Number(event.target.value))}
            slotProps={{ select: { MenuProps: { classes: { paper: styles.menu } } } }}
        >
            {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                    {category.name}
                </MenuItem>
            ))}
        </TextField>
    );
}
