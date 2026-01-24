import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useCollectionSearchStore } from '@/stores/collectionSearchStore';
import CloseIcon from '@mui/icons-material/Close';

export default function CollectionSearchBar() {
    const { query, setQuery, resetQuery } = useCollectionSearchStore();

    return (
        <TextField
            placeholder="Search"
            variant="outlined"
            onChange={(x) => setQuery(x.target.value)}
            size="small"
            value={query}
            InputProps={{
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
            }}
            sx={{
                width: { xs: '100%', sm: '100%', lg: 200, xl: 200 },
            }}
        />
    );
}
