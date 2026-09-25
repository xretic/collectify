'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Avatar, Button } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import { EmptyState } from '@/shared/ui/EmptyState';
import { SearchField } from '@/shared/ui/SearchField';
import { Spinner } from '@/shared/ui/Spinner';
import styles from '../ManagementSidebar/list.module.css';
import { useTranslations } from 'next-intl';

type UsersListProps = {
    selectedId: number | null;
    onSelect: (userId: number) => void;
};

export function UsersList({ selectedId, onSelect }: UsersListProps) {
    const t = useTranslations('management.users');
    const tc = useTranslations('common');
    const [input, setInput] = useState('');
    const query = useDebounce(input.trim());

    const users = useInfiniteQuery({
        queryKey: managementQueryKeys.users(query, null),
        queryFn: ({ pageParam }) => managementApi.users({ query, page: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    const rows = users.data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <>
            <SearchField
                value={input}
                onChange={setInput}
                placeholder={t('search')}
                className={styles.search}
            />

            <div className={styles.list}>
                {users.isPending && <Spinner />}
                {users.isSuccess && rows.length === 0 && <EmptyState title={t('empty')} />}

                {rows.map((user) => (
                    <button
                        key={user.id}
                        type="button"
                        className={`${styles.row} ${user.id === selectedId ? styles.rowActive : ''}`}
                        onClick={() => onSelect(user.id)}
                    >
                        <Avatar src={user.avatarUrl} alt={user.username} />
                        <span className={styles.meta}>
                            <span className={styles.primary}>{user.fullName || user.username}</span>
                            <span className={styles.secondary}>
                                @{user.username}
                                {user.activeSanctions.length > 0 && ` · ${t('sanctioned')}`}
                            </span>
                        </span>
                    </button>
                ))}

                {users.hasNextPage && (
                    <Button
                        onClick={() => users.fetchNextPage()}
                        disabled={users.isFetchingNextPage}
                    >
                        {tc('loadMore')}
                    </Button>
                )}
            </div>
        </>
    );
}
