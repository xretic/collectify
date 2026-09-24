import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useId } from 'react';
import styles from './index.module.css';

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
    label = 'Sort by',
}: SortSelectProps<T>) {
    const labelId = useId();

    return (
        <FormControl size="small" className={styles.control}>
            <InputLabel id={labelId}>{label}</InputLabel>
            <Select
                labelId={labelId}
                label={label}
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
