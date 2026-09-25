'use client';

import { Dialog, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { useQuery } from '@tanstack/react-query';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import type { CollectionStats } from '@/entities/collection/model/types';
import { Spinner } from '@/shared/ui/Spinner';
import { EmptyState } from '@/shared/ui/EmptyState';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

// Line colours are chart props (SVG attributes); the legend reuses them via CSS classes.
const SERIES = [
    { key: 'likes', color: '#ff2b2e', icon: FavoriteBorderIcon, className: styles.likes },
    { key: 'comments', color: '#8ab3ff', icon: ForumOutlinedIcon, className: styles.comments },
    { key: 'favorites', color: '#ff9800', icon: BookmarkBorderIcon, className: styles.favorites },
] as const;

function toChartData(stats: CollectionStats) {
    return stats.days.map((day, index) => ({
        day,
        likes: stats.likes[index] ?? 0,
        comments: stats.comments[index] ?? 0,
        favorites: stats.favorites[index] ?? 0,
    }));
}

function ChartLegend() {
    const t = useTranslations('collection.stats');

    return (
        <div className={styles.legend}>
            {SERIES.map(({ key, className, icon: Icon }) => (
                <span key={key} className={`${styles.legendItem} ${className}`}>
                    <Icon fontSize="inherit" />
                    <span className={styles.legendLabel}>{t(key)}</span>
                </span>
            ))}
        </div>
    );
}

type CollectionStatsDialogProps = {
    collectionId: number;
    open: boolean;
    onClose: () => void;
};

export function CollectionStatsDialog({ collectionId, open, onClose }: CollectionStatsDialogProps) {
    const t = useTranslations('collection.stats');
    const tc = useTranslations('common');
    const { data, isPending, isError } = useQuery({
        queryKey: collectionQueryKeys.stats(collectionId),
        queryFn: () => collectionApi.stats(collectionId),
        enabled: open,
        staleTime: 60_000,
    });

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{t('title')}</DialogTitle>

            <IconButton className={styles.close} onClick={onClose} aria-label={tc('close')}>
                <CloseIcon />
            </IconButton>

            <DialogContent>
                <DialogContentText color="inherit" className={styles.intro}>
                    {t('intro')}
                </DialogContentText>

                {isPending && <Spinner />}
                {isError && <EmptyState title={t('unavailable')} />}
                {data && data.days.length === 0 && <EmptyState title={t('empty')} />}

                {data && data.days.length > 0 && (
                    <div className={styles.chart}>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart
                                data={toChartData(data)}
                                margin={{ top: 30, right: 20, left: 0, bottom: 5 }}
                            >
                                <XAxis dataKey="day" tickLine={false} className={styles.axis} />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    className={styles.axis}
                                />
                                <Tooltip wrapperClassName={styles.tooltip} />
                                <Legend content={<ChartLegend />} verticalAlign="top" />
                                {SERIES.map(({ key, color }) => (
                                    <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={t(key)}
                                        stroke={color}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
