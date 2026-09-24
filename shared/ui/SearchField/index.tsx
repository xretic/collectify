import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import styles from './index.module.css';

type SearchFieldProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function SearchField({
    value,
    onChange,
    placeholder = 'Search',
    className,
}: SearchFieldProps) {
    return (
        <TextField
            className={`${styles.field} ${className ?? ''}`}
            size="small"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                    endAdornment: value ? (
                        <InputAdornment
                            position="end"
                            className={styles.clear}
                            onClick={() => onChange('')}
                        >
                            <CloseIcon fontSize="small" />
                        </InputAdornment>
                    ) : null,
                },
            }}
        />
    );
}
