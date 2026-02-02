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
            sx={{
                ml: { xs: 0, sm: 'auto' },
                mt: { xs: 2, sm: 0 },
                width: { xs: '100%', sm: '100%', lg: 110, xl: 110 },
                opacity: disabled ? 0.6 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                '& .MuiOutlinedInput-root': {
                    borderRadius: 5,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--text-color)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--text-color)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--text-color)',
                    },
                    '& .MuiSvgIcon-root': {
                        color: 'var(--text-color)',
                    },
                    '& .MuiSelect-select': {
                        color: 'var(--text-color)',
                    },
                },
            }}
        >
            <InputLabel style={{ color: 'var(--text-color)' }} id="sort-select-label">
                Sorted by
            </InputLabel>

            <Select
                labelId="sort-select-label"
                id="sort-select"
                value={sortedBy}
                label="Sorted by"
                sx={{
                    height: 40,
                    borderRadius: 5,
                    color: 'var(--text-color)',
                }}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            bgcolor: 'var(--bg-color)',
                            borderRadius: 2,
                            mt: 1,
                        },
                    },
                }}
            >
                <MenuItem
                    sx={{ color: 'var(--text-color)' }}
                    value="popular"
                    onClick={() => setSortedBy('popular')}
                >
                    Popular
                </MenuItem>
                <MenuItem
                    sx={{ color: 'var(--text-color)' }}
                    value="newest"
                    onClick={() => setSortedBy('newest')}
                >
                    Newest
                </MenuItem>
                <MenuItem
                    sx={{ color: 'var(--text-color)' }}
                    value="old"
                    onClick={() => setSortedBy('old')}
                >
                    Oldest
                </MenuItem>
            </Select>
        </FormControl>
    );
}
