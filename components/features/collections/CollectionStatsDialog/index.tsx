'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Stack, IconButton } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { useUser } from '@/context/UserProvider';
import { Loader } from '@/components/ui/Loader';
import CloseIcon from '@mui/icons-material/Close';
import { CustomLegend } from './components/CustomLegend';

interface CollectionStatsResponse {
    days: string[];
    likesData: number[];
    commentsData: number[];
    favoritesData: number[];
}

interface CollectionChartProps {
    stats: CollectionStatsResponse;
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
    const [stats, setStats] = useState<CollectionStatsResponse | null>(null);
    const { startLoading, stopLoading } = useUIStore();
    const { user, loading } = useUser();

    const getStats = async () => {
        startLoading();
        try {
            const data = await api
                .get(`api/collections/${id}/stats`)
                .json<CollectionStatsResponse>();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (!id) return;
        getStats();
    }, [id]);

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

            <DialogContent>{!stats ? <Loader /> : <CollectionChart stats={stats} />}</DialogContent>
        </Dialog>
    );
}
