'use client';

import { useState } from 'react';
import {
    Autocomplete,
    TextField,
    Avatar,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Box,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import CloseIcon from '@mui/icons-material/Close';
import { useUIStore } from '@/stores/uiStore';
import { useDebounce } from '@/lib/useDebounce';
import styles from './index.module.css';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface User {
    id: number;
    username: string;
    avatarUrl: string;
}

export default function UserSearchBar() {
    const router = useRouter();
    const { setSearchBarOpened } = useUIStore();
    const [inputValue, setInputValue] = useState('');
    const debouncedQuery = useDebounce(inputValue, 400);

    const handleSelect = (_: any, value: User | string | null) => {
        if (!value) return;

        if (typeof value !== 'string') {
            router.push(`/users/${value.id.toString()}`);
        }
    };
    const { data } = useQuery({
        queryKey: ['users-search', debouncedQuery],
        enabled: !!debouncedQuery,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        queryFn: () => api.get(`api/users/search/${debouncedQuery}`).json<{ users: User[] }>(),
    });

    const users = data?.users ?? [];

    return (
        <Autocomplete
            className={styles['container']}
            freeSolo
            options={users}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.username)}
            inputValue={inputValue}
            onChange={handleSelect}
            onInputChange={(_, newValue) => setInputValue(newValue)}
            disableClearable
            slots={{
                paper: (props) => (
                    <Paper
                        {...props}
                        sx={{
                            mt: 1,
                            backgroundColor: 'var(--container-color)',
                            overflow: 'hidden',
                        }}
                    >
                        {props.children}
                        {debouncedQuery && users.length === 0 && (
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    color: 'var(--soft-text)',
                                    textAlign: 'center',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                Nothing found
                            </Box>
                        )}
                    </Paper>
                ),
            }}
            renderOption={(props, option) => (
                <ListItem
                    sx={{
                        color: 'var(--text-color) !important',
                        backgroundColor: 'var(--container-color) !important',
                        '&:hover': {
                            backgroundColor: 'var(--accent) !important',
                            color: 'var(--text-color) !important',
                        },
                        '&.Mui-selected, &.Mui-selected.Mui-focusVisible': {
                            backgroundColor: 'var(--container-color) !important',
                            color: 'var(--text-color) !important',
                        },
                        '&.Mui-focusVisible': {
                            backgroundColor: 'var(--container-color) !important',
                        },
                        '& .MuiListItemText-primary': {
                            color: 'var(--text-color) !important',
                        },
                    }}
                    {...props}
                    key={option.username}
                >
                    <ListItemAvatar key={option.id}>
                        <Avatar src={option.avatarUrl} alt={option.username} />
                    </ListItemAvatar>
                    <ListItemText key={option.username} primary={option.username} />
                </ListItem>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    autoFocus
                    onBlur={() => setSearchBarOpened()}
                    className={styles.placeholder}
                    placeholder="Find a user"
                    variant="outlined"
                    size="small"
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {params.InputProps.endAdornment}
                                    <CloseIcon
                                        onClick={() => setSearchBarOpened()}
                                        sx={{ color: '#afafaf', cursor: 'pointer', ml: 1 }}
                                    />
                                </>
                            ),
                        },
                    }}
                />
            )}
        />
    );
}
