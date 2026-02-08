'use client';

import { useEffect, useState } from 'react';
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

interface User {
    id: number;
    username: string;
    avatarUrl: string;
}

export default function UserSearchBar() {
    const router = useRouter();
    const { setSearchBarOpened } = useUIStore();
    const [users, setUsers] = useState<User[]>([]);
    const [inputValue, setInputValue] = useState('');
    const debouncedQuery = useDebounce(inputValue, 400);

    const handleSelect = (_: any, value: User | string | null) => {
        if (!value) return;

        if (typeof value !== 'string') {
            router.push(`/users/${value.id.toString()}`);
        }
    };

    useEffect(() => {
        const loadUsers = async () => {
            if (!debouncedQuery) {
                setUsers([]);
                return;
            }

            const res = await fetch('/api/users/search/' + debouncedQuery, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await res.json();
            setUsers(data.users ?? []);
        };

        loadUsers();
    }, [debouncedQuery]);

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
                    <ListItemText primary={option.username} />
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
