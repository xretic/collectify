import { useUIStore } from '@/stores/uiStore';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

interface SortByProps {
    className?: string;
    disabled: boolean;
}

export default function SortBy({ className = '', disabled }: SortByProps) {
    const { sortedBy, setSortedBy } = useUIStore();

    return (
        <FormControl
            className={className}
            disabled={disabled}
            sx={{
                ml: { xs: 0, sm: 'auto' },
                mt: { xs: 2, sm: 0 },
                width: { xs: '100%', sm: '100%', lg: 110, xl: 110 },
            }}
        >
            <InputLabel id="sort-select-label">Sorted by</InputLabel>

            <Select
                labelId="sort-select-label"
                id="sort-select"
                value={sortedBy}
                label="Sorted by"
                sx={{
                    height: 40,
                    borderRadius: 5,
                }}
            >
                <MenuItem value="popular" onClick={() => setSortedBy('popular')}>
                    Popular
                </MenuItem>
                <MenuItem value="newest" onClick={() => setSortedBy('newest')}>
                    Newest
                </MenuItem>
                <MenuItem value="old" onClick={() => setSortedBy('old')}>
                    Oldest
                </MenuItem>
            </Select>
        </FormControl>
    );
}
