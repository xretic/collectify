import { Button } from '@mui/material';
import { CATEGORIES, type Category } from '@/shared/lib/constants';
import styles from './index.module.css';

type CategoryChipsProps = {
    value: Category | undefined;
    onChange: (value: Category | undefined) => void;
};

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
    return (
        <div className={styles.chips} role="group" aria-label="Category">
            <Button
                variant={value ? 'outlined' : 'contained'}
                onClick={() => onChange(undefined)}
                className={styles.chip}
            >
                All
            </Button>

            {CATEGORIES.map((category) => (
                <Button
                    key={category}
                    variant={value === category ? 'contained' : 'outlined'}
                    onClick={() => onChange(category)}
                    className={styles.chip}
                >
                    {category}
                </Button>
            ))}
        </div>
    );
}
