'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Autocomplete,
    Avatar,
    ListItem,
    ListItemAvatar,
    ListItemText,
    TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import type { UserPreview } from '@/entities/user/model/types';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import styles from './index.module.css';

export default function UserSearchBar({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const [inputValue, setInputValue] = useState('');
    const query = useDebounce(inputValue.trim(), 300);

    const { data: users = [], isFetching } = useQuery({
        queryKey: userQueryKeys.search(query),
        enabled: query.length > 0,
        staleTime: 60_000,
        queryFn: () => userApi.search(query),
    });

    const handleSelect = (_: unknown, value: UserPreview | string | null) => {
        if (!value || typeof value === 'string') return;

        onClose();
        router.push(`/users/${value.id}`);
    };

    return (
        <Autocomplete
            className={styles.container}
            freeSolo
            disableClearable
            options={users}
            loading={isFetching}
            filterOptions={(options) => options}
            noOptionsText={query ? 'Nothing found' : 'Start typing a username'}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.username)}
            inputValue={inputValue}
            onChange={handleSelect}
            onInputChange={(_, value) => setInputValue(value)}
            classes={{ paper: styles.paper, option: styles.option }}
            renderOption={(props, option) => {
                const { key, ...rest } = props;

                return (
                    <ListItem key={key} {...rest}>
                        <ListItemAvatar>
                            <Avatar src={option.avatarUrl} alt={option.username} />
                        </ListItemAvatar>
                        <ListItemText primary={option.username} />
                    </ListItem>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    autoFocus
                    size="small"
                    placeholder="Find a user"
                    onBlur={onClose}
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {params.InputProps.endAdornment}
                                    <CloseIcon className={styles.close} onClick={onClose} />
                                </>
                            ),
                        },
                    }}
                />
            )}
        />
    );
}
