import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useCollectionSearchStore } from '@/stores/collectionSearchStore';
import CloseIcon from '@mui/icons-material/Close';

interface CollectionSearchBarProps {
    disabled: boolean;
}

export default function CollectionSearchBar({ disabled }: CollectionSearchBarProps) {
    const { query, setQuery, resetQuery } = useCollectionSearchStore();

    return (
        <TextField
            disabled={disabled}
            placeholder="Search"
            variant="outlined"
            onChange={(x) => setQuery(x.target.value)}
            size="small"
            value={query}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                    endAdornment: query ? (
                        <InputAdornment
                            position="end"
                            style={{ cursor: 'pointer' }}
                            onClick={resetQuery}
                        >
                            <CloseIcon />
                        </InputAdornment>
                    ) : null,
                },
            }}
            sx={{
                width: { xs: '100%', sm: '100%', lg: 200, xl: 200 },
                opacity: disabled ? 0.6 : 1,
                '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--text-color)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--text-color)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--accent)',
                    },
                    '& .MuiSvgIcon-root': {
                        color: 'var(--text-color)',
                    },
                    '& input': {
                        color: 'var(--text-color)',
                        WebkitTextFillColor: 'var(--text-color)',
                    },
                },
            }}
        />
    );
}
