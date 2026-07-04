'use client';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    Stack,
    IconButton,
    DialogContentText,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUser } from '@/app/providers/UserProvider';
import { Loader } from '@/shared/ui/Loader';
import CloseIcon from '@mui/icons-material/Close';
import { CustomLegend } from './components/CustomLegend';
import { useQuery } from '@tanstack/react-query';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { CollectionStats } from '@/entities/collection/model/types';

interface CollectionChartProps {
    stats: CollectionStats;
}

function CollectionChart({ stats }: CollectionChartProps) {
    const chartData = stats.days.map((day, idx) => ({
        day,
        Likes: stats.likesData[idx] ?? 0,
        Comments: stats.commentsData[idx] ?? 0,
        Favorites: stats.favoritesData[idx] ?? 0,
    }));

    return (
        <Stack sx={{ width: '100%', p: 2 }} spacing={2}>
            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ddd' }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ddd' }}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            color: 'var(--text-color)',
                            backgroundColor: 'var(--container-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 4,
                            fontSize: 12,
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                    />

                    <Legend content={<CustomLegend />} />

                    <Line
                        type="monotone"
                        dataKey="Likes"
                        stroke="#ff2b2e"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="Comments"
                        stroke="#8ab3ff"
                        strokeWidth={2}
                        dot={true}
                    />
                    <Line
                        type="monotone"
                        dataKey="Favorites"
                        stroke="#ff9800"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Stack>
    );
}

interface CollectionStatsDialogProps {
    id: string;
    open?: boolean;
    onClose?: () => void;
}

export default function CollectionStatsDialog({
    id,
    open = true,
    onClose,
}: CollectionStatsDialogProps) {
    const { user, loading } = useUser();

    const {
        data: stats,
        isError,
        isLoading,
    } = useQuery({
        queryKey: collectionQueryKeys.stats(id),
        queryFn: () => collectionApi.getStats(id),
        enabled: open && !!id,
        retry: false,
        staleTime: 60_000,
    });

    if (loading && !user) return null;

    return (
        <Dialog
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: 'var(--container-color)',
                        color: 'var(--text-color)',
                        borderRadius: 3,
                    },
                },
            }}
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>
                Statistics
                {onClose ? (
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'var(--soft-text)',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                ) : null}
            </DialogTitle>

            <DialogContent>
                <DialogContentText sx={{ color: 'var(--soft-text)' }}>
                    Detailed information about activity on your collection by day
                </DialogContentText>

                {isLoading ? <Loader /> : null}
                {isError ? (
                    <DialogContentText sx={{ color: 'var(--soft-text)', mt: 2 }}>
                        Statistics are unavailable for this collection.
                    </DialogContentText>
                ) : null}
                {stats ? <CollectionChart stats={stats} /> : null}
            </DialogContent>
        </Dialog>
    );
}
