'use client';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useId } from 'react';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type Option<T extends string> = { value: T; label: string };

type SortSelectProps<T extends string> = {
    value: T;
    options: readonly Option<T>[];
    onChange: (value: T) => void;
    label?: string;
};

export function SortSelect<T extends string>({
    value,
    options,
    onChange,
    label,
}: SortSelectProps<T>) {
    const t = useTranslations('common');
    const labelId = useId();

    return (
        <FormControl size="small" className={styles.control}>
            <InputLabel id={labelId}>{label ?? t('sortBy')}</InputLabel>
            <Select
                labelId={labelId}
                label={label ?? t('sortBy')}
                value={value}
                onChange={(event) => onChange(event.target.value as T)}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
