'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Avatar, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { managementApi, type ReportFilters } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';
import {
    REPORT_REASON_LABELS,
    REPORT_REASONS,
    REPORT_TARGET_LABELS,
    REPORT_TARGET_TYPES,
    type ReportReason,
    type ReportStatus,
    type ReportTargetType,
} from '@/entities/report/model/types';
import { EmptyState } from '@/shared/ui/EmptyState';
import { RelativeTime } from '@/shared/ui/RelativeTime';
import { Spinner } from '@/shared/ui/Spinner';
import styles from '../ManagementSidebar/list.module.css';

type ReportsQueueProps = {
    filters: ReportFilters;
    onFiltersChange: (filters: ReportFilters) => void;
    selectedId: number | null;
    onSelect: (reportId: number) => void;
};

export function ReportsQueue({
    filters,
    onFiltersChange,
    selectedId,
    onSelect,
}: ReportsQueueProps) {
    const reports = useInfiniteQuery({
        queryKey: managementQueryKeys.reports(filters),
        queryFn: ({ pageParam }) => managementApi.reports(filters, pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const rows = reports.data?.pages.flatMap((page) => page.data) ?? [];
    const total = reports.data?.pages[0]?.total ?? 0;

    return (
        <>
            <div className={styles.filters}>
                <div className={styles.statusSwitch}>
                    {(['OPEN', 'CLOSED'] as ReportStatus[]).map((status) => (
                        <Button
                            key={status}
                            size="small"
                            variant={filters.status === status ? 'contained' : 'outlined'}
                            onClick={() => onFiltersChange({ ...filters, status })}
                        >
                            {status === 'OPEN'
                                ? `Open (${filters.status === 'OPEN' ? total : '…'})`
                                : 'Closed'}
                        </Button>
                    ))}
                </div>

                <div className={styles.filterRow}>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="report-type-filter">Type</InputLabel>
                        <Select
                            labelId="report-type-filter"
                            label="Type"
                            value={filters.targetType ?? ''}
                            onChange={(event) =>
                                onFiltersChange({
                                    ...filters,
                                    targetType: (event.target.value || undefined) as
                                        | ReportTargetType
                                        | undefined,
                                })
                            }
                        >
                            <MenuItem value="">All</MenuItem>
                            {REPORT_TARGET_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {REPORT_TARGET_LABELS[type]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth>
                        <InputLabel id="report-reason-filter">Reason</InputLabel>
                        <Select
                            labelId="report-reason-filter"
                            label="Reason"
                            value={filters.reason ?? ''}
                            onChange={(event) =>
                                onFiltersChange({
                                    ...filters,
                                    reason: (event.target.value || undefined) as
                                        | ReportReason
                                        | undefined,
                                })
                            }
                        >
                            <MenuItem value="">All</MenuItem>
                            {REPORT_REASONS.map((reason) => (
                                <MenuItem key={reason} value={reason}>
                                    {REPORT_REASON_LABELS[reason]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>
            </div>

            <div className={styles.list}>
                {reports.isPending && <Spinner />}
                {reports.isSuccess && rows.length === 0 && (
                    <EmptyState
                        title={
                            filters.status === 'OPEN' ? 'The queue is empty' : 'No closed reports'
                        }
                    />
                )}

                {rows.map((report) => (
                    <button
                        key={report.id}
                        type="button"
                        className={`${styles.row} ${report.id === selectedId ? styles.rowActive : ''}`}
                        onClick={() => onSelect(report.id)}
                    >
                        <Avatar
                            src={report.targetUser.avatarUrl}
                            alt={report.targetUser.username}
                        />
                        <span className={styles.meta}>
                            <span className={styles.primary}>
                                #{report.id} · @{report.targetUser.username}
                            </span>
                            <span className={styles.secondary}>
                                {REPORT_TARGET_LABELS[report.targetType]} ·{' '}
                                {REPORT_REASON_LABELS[report.reason]} ·{' '}
                                <RelativeTime value={report.createdAt} />
                            </span>
                        </span>
                    </button>
                ))}

                {reports.hasNextPage && (
                    <Button
                        onClick={() => reports.fetchNextPage()}
                        disabled={reports.isFetchingNextPage}
                    >
                        Load more
                    </Button>
                )}
            </div>
        </>
    );
}
