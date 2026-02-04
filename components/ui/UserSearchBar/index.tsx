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
            if (!debouncedQuery) return;

            const res = await fetch('/api/users/search/' + inputValue, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await res.json();
            setUsers(data.users);
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
            disableClearable={true}
            slots={{
                paper: (props) => (
                    <Paper {...props} sx={{ mt: 1, backgroundColor: 'var(--container-color)' }} />
                ),
            }}
            renderOption={(props, option) => {
                return (
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
                        <ListItemAvatar key={option.avatarUrl}>
                            <Avatar src={option.avatarUrl} alt={option.username} />
                        </ListItemAvatar>
                        <ListItemText key={option.username} primary={option.username} />
                    </ListItem>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    autoFocus
                    onBlur={() => setSearchBarOpened()}
                    className={styles.placeholder}
                    placeholder="Find a user"
                    variant="outlined"
                    size="small"
                    InputProps={{
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
                    }}
                />
            )}
        />
    );
}
