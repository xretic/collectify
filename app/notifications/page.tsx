'use client';

import { Button, Box, SxProps, Theme } from '@mui/material';
import { useEffect, useState } from 'react';
import styles from './notifications.module.css';
import DoneIcon from '@mui/icons-material/Done';
import { NotificationInResponse } from '@/types/NotificationInResponse';
import { useUIStore } from '@/stores/uiStore';
import { useUser } from '@/context/UserProvider';
import { useDebounce } from '@/lib/useDebounce';
import Notification from '@/components/Notification/Notification';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { Typography } from '@mui/material';

type Tab = 'all' | 'unread';

const baseButton: SxProps<Theme> = {
    borderRadius: 6,
    height: 36,
    px: 2,
    textTransform: 'none',
    fontWeight: 500,
    display: 'flex',
    gap: 1,
};

const buttonSx = (active: boolean): SxProps<Theme> => ({
    ...baseButton,
    borderColor: '#e5e7eb',
    color: active ? '#fff' : '#000',
});

const counterSx = (active: boolean): SxProps<Theme> => ({
    minWidth: 22,
    height: 22,
    px: 0.5,
    borderRadius: 6,
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
});

export default function NotificationsPage() {
    const { loading } = useUser();
    const [active, setActive] = useState<Tab>('all');
    const [totalAmount, setTotalAmount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationInResponse[]>([]);
    const { startLoading, stopLoading } = useUIStore();

    const debouncedTab = useDebounce(active, 500);

    const getNotifications = async () => {
        startLoading();

        const response = await fetch(
            `/api/notifications?onlyUnread=${active === 'all' ? 'false' : 'true'}`,
        );

        if (!response.ok) return;

        const data = await response.json();
        const responseNotifications: NotificationInResponse[] = data.data;

        setNotifications(responseNotifications);
        setTotalAmount(data.totalAmount);
        setUnreadCount(data.unreadAmount);
        stopLoading();
    };

    const markAllAsRead = async () => {
        startLoading();

        const response = await fetch('/api/notifications', {
            method: 'PATCH',
        });

        if (!response.ok) return;

        const data = await response.json();
        const responseNotifications: NotificationInResponse[] = data.data;

        setNotifications(responseNotifications);
        setUnreadCount(0);
        stopLoading();
    };

    const tabs: Array<{ id: Tab; label: string; count: number; disabled: boolean }> = [
        { id: 'all', label: 'All', count: totalAmount, disabled: debouncedTab !== active },
        { id: 'unread', label: 'Unread', count: unreadCount, disabled: debouncedTab !== active },
    ];

    useEffect(() => {
        if (loading) return;

        const handler = setTimeout(getNotifications, 400);
        return () => clearTimeout(handler);
    }, [loading, debouncedTab]);

    if (loading) return null;

    return (
        <>
            <header className={styles['header']}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {tabs.map(({ id, label, count, disabled }) => {
                        const isActive = active === id;

                        return (
                            <Button
                                key={id}
                                disabled={disabled}
                                onClick={() => setActive(id)}
                                variant={isActive ? 'contained' : 'outlined'}
                                sx={buttonSx(isActive)}
                            >
                                <span>{label}</span>
                                <Box sx={counterSx(isActive)}>{count}</Box>
                            </Button>
                        );
                    })}

                    <Button
                        variant="text"
                        onClick={markAllAsRead}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 6,
                            marginLeft: 'auto',
                        }}
                        disabled={unreadCount === 0}
                    >
                        <DoneIcon sx={{ width: 18, height: 18 }} />
                        <span className={styles['mark-as-read-text']}>Mark all as read</span>
                    </Button>
                </Box>
            </header>

            <header className={styles['notifications']}>
                {notifications.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            padding: 4,
                            width: '100%',
                            height: '300px',
                            backgroundColor: '#f9fafb',
                            borderRadius: 6,
                            textAlign: 'center',
                            color: '#6b7280',
                        }}
                    >
                        <NotificationsNoneIcon sx={{ fontSize: 60, color: '#9ca3af' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            No unread notifications
                        </Typography>
                        <Typography variant="body2">
                            You're all caught up! Check back later for new updates.
                        </Typography>
                    </Box>
                ) : (
                    notifications.map((x) => (
                        <Notification
                            key={x.user.id}
                            id={x.user.id}
                            username={x.user.username}
                            avatarUrl={x.user.avatarUrl}
                            isRead={x.notification.isRead}
                            type={x.notification.type}
                            createdAt={x.notification.createdAt}
                        />
                    ))
                )}
            </header>
        </>
    );
}
