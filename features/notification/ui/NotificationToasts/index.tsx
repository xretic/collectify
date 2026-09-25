'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { AppNotification } from '@/entities/notification/model/types';
import { NotificationItem } from '@/entities/notification/ui/NotificationItem';
import type { ChatMessage } from '@/entities/chat/model/types';
import { MessageNotice } from '@/entities/chat/ui/MessageNotice';
import { useRealtimeEvent } from '@/shared/lib/realtime/RealtimeProvider';
import { useMarkNotificationRead } from '../../model/useMarkNotificationRead';
import { useNotificationCache } from '../../model/useNotificationCache';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const VISIBLE_MS = 5000;
const EXIT_MS = 220;
const MAX_TOASTS = 3;

type Toast = { key: string; leaving: boolean } & (
    | { kind: 'notification'; notification: AppNotification }
    | { kind: 'message'; message: ChatMessage }
);

const notificationKey = (id: number) => `notification:${id}`;
// One toast per chat: a newer message replaces the previous one.
const messageKey = (chatId: number) => `message:${chatId}`;

/**
 * Live notifications: every `notification:new` and every message of an
 * unmuted chat (`message:notify`) pops up bottom-right for five seconds
 * (paused while hovered). Clicking opens the target.
 */
export function NotificationToasts() {
    const pathname = usePathname();
    const cache = useNotificationCache();
    const markRead = useMarkNotificationRead();
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((key: string) => {
        setToasts((current) =>
            current.map((toast) => (toast.key === key ? { ...toast, leaving: true } : toast)),
        );
        setTimeout(
            () => setToasts((current) => current.filter((toast) => toast.key !== key)),
            EXIT_MS,
        );
    }, []);

    const push = (toast: Toast) =>
        setToasts((current) =>
            [toast, ...current.filter((other) => other.key !== toast.key)].slice(0, MAX_TOASTS),
        );

    useRealtimeEvent('notification:new', ({ notification, unread }) => {
        cache.setUnread(unread);
        cache.refetchLists();

        // The list itself shows it already.
        if (pathname === '/notifications') return;

        push({
            key: notificationKey(notification.id),
            kind: 'notification',
            notification,
            leaving: false,
        });
    });

    useRealtimeEvent('message:notify', (message) => {
        // The open chat shows it already.
        const open = pathname === `/chats/${message.chatId}`;
        if (open && document.visibilityState === 'visible') return;

        push({ key: messageKey(message.chatId), kind: 'message', message, leaving: false });
    });

    // Muting a chat hides what it already popped up.
    useRealtimeEvent('chat:muted', ({ chatId, mute }) => {
        if (mute) dismiss(messageKey(chatId));
    });

    useRealtimeEvent('notification:removed', ({ ids, unread }) => {
        cache.setUnread(unread);
        if (ids.length > 0) {
            cache.refetchLists();
            ids.forEach((id) => dismiss(notificationKey(id)));
        }
    });

    return (
        <div className={styles.stack} aria-live="polite">
            {toasts.map((toast) => (
                <ToastCard
                    key={toast.key}
                    leaving={toast.leaving}
                    onDismiss={() => dismiss(toast.key)}
                >
                    {(close) =>
                        toast.kind === 'notification' ? (
                            <NotificationItem
                                notification={toast.notification}
                                variant="toast"
                                onOpen={() => {
                                    markRead.mutate(toast.notification.id);
                                    dismiss(toast.key);
                                }}
                                aside={close}
                            />
                        ) : (
                            <MessageNotice
                                message={toast.message}
                                onOpen={() => dismiss(toast.key)}
                                aside={close}
                            />
                        )
                    }
                </ToastCard>
            ))}
        </div>
    );
}

type ToastCardProps = {
    leaving: boolean;
    onDismiss: () => void;
    /** Card content; receives the close button to place on its right. */
    children: (close: ReactNode) => ReactNode;
};

function ToastCard({ leaving, onDismiss, children }: ToastCardProps) {
    const t = useTranslations('notifications');
    const [paused, setPaused] = useState(false);
    const remaining = useRef(VISIBLE_MS);
    const startedAt = useRef(0);

    useEffect(() => {
        if (paused || leaving) return;

        startedAt.current = Date.now();
        const timer = setTimeout(onDismiss, remaining.current);

        return () => {
            clearTimeout(timer);
            remaining.current -= Date.now() - startedAt.current;
        };
    }, [paused, leaving, onDismiss]);

    return (
        <div
            className={`${styles.toast} ${leaving ? styles.leaving : ''} ${paused ? styles.paused : ''}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            role="status"
        >
            {children(
                <IconButton
                    size="small"
                    className={styles.close}
                    onClick={onDismiss}
                    aria-label={t('dismiss')}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>,
            )}
            <span className={styles.progress} />
        </div>
    );
}
