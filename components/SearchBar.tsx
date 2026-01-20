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

interface User {
    id: number;
    username: string;
    avatarUrl: string;
}

export default function SearchBar() {
    const router = useRouter();
    const { setSearchBarOpened } = useUIStore();
    const [users, setUsers] = useState<User[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<User[]>([]);

    const handleSelect = (_: any, value: User | string | null) => {
        if (!value) return;

        if (typeof value !== 'string') {
            router.push(`/users/${value.id.toString()}`);
        }
    };

    useEffect(() => {
        const loadUsers = async () => {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data.users);
        };
        loadUsers();
    }, []);

    useEffect(() => {
        if (!inputValue) {
            setOptions([]);
            return;
        }

        const filtered = users
            .filter((u) => u.username.toLowerCase().includes(inputValue.toLowerCase()))
            .slice(0, 5);

        setOptions(filtered);
    }, [inputValue, users]);

    return (
        <Autocomplete
            className="search-bar-form"
            freeSolo
            options={options}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.username)}
            inputValue={inputValue}
            onChange={handleSelect}
            onInputChange={(_, newValue) => setInputValue(newValue)}
            disableClearable={true}
            slots={{
                paper: (props) => <Paper {...props} sx={{ mt: 1 }} />,
            }}
            renderOption={(props, option) => {
                if (typeof option === 'string') {
                    return (
                        <ListItem {...props} key={option}>
                            <ListItemText primary={option} />
                        </ListItem>
                    );
                }
                return (
                    <ListItem {...props} key={option.username}>
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
                    placeholder="Search users"
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
