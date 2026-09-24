'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';
import { formatDateTime } from '@/shared/lib/format/date';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { formatAuditAction } from '../../lib/audit';
import { useManagedUser } from '../../model/useManagedUser';
import styles from './index.module.css';

export function AuditPanel({ userId }: { userId: number }) {
    const { user } = useManagedUser(userId);
    const query = useInfiniteQuery({
        queryKey: managementQueryKeys.audit(userId),
        queryFn: ({ pageParam }) => managementApi.audit(userId, pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const records = query.data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <section className={styles.audit}>
            <h2 className={styles.title}>Audit{user && ` for @${user.username}`}</h2>

            {query.isPending && <Spinner />}
            {query.isSuccess && records.length === 0 && <EmptyState title="No audit records yet" />}

            <ul className={styles.list}>
                {records.map((record) => (
                    <li key={record.id} className={styles.row}>
                        <span className={styles.action}>{formatAuditAction(record.action)}</span>
                        <span className={styles.meta}>
                            {record.actor?.username ?? 'system'}
                            {record.impersonator && ` (via @${record.impersonator.username})`}
                            {' → '}
                            {record.targetUser?.username ?? 'content'} ·{' '}
                            {formatDateTime(record.createdAt)}
                        </span>
                        {record.reason && <span className={styles.reason}>{record.reason}</span>}
                    </li>
                ))}
            </ul>

            {query.hasNextPage && (
                <Button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                    Load more
                </Button>
            )}
        </section>
    );
}
