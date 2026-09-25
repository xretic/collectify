'use client';

import { useState, type MouseEvent } from 'react';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import type { MuteDuration } from '@/entities/chat/model/schemas';
import type { ChatMuteState } from '@/entities/chat/model/types';
import { formatChatTimestamp } from '@/shared/lib/format/date';
import { useChatMute } from '../../model/useChatMute';
import styles from './index.module.css';

const DURATIONS: { value: Exclude<MuteDuration, 'forever'>; label: string }[] = [
    { value: '15m', label: '15 minutes' },
    { value: '30m', label: '30 minutes' },
    { value: '1h', label: '1 hour' },
    { value: '8h', label: '8 hours' },
    { value: '1d', label: '1 day' },
    { value: '1w', label: '1 week' },
];

type ChatMuteMenuProps = {
    chatId: number;
    /** Current mute, already checked for expiry. */
    mute: ChatMuteState | null;
    className?: string;
};

/** "⋯" menu of a chat row: mute for a while (Telegram-style submenu) or turn notifications off. */
export function ChatMuteMenu({ chatId, mute, className }: ChatMuteMenuProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [view, setView] = useState<'main' | 'durations'>('main');
    // Slide the main view in only when coming back from the durations.
    const [returned, setReturned] = useState(false);
    const actions = useChatMute(chatId);

    const open = anchorEl !== null;
    const close = () => setAnchorEl(null);
    const run = (action: () => void) => {
        close();
        action();
    };

    return (
        <>
            <IconButton
                size="small"
                color="inherit"
                className={`${className ?? ''} ${open ? styles.buttonOpen : ''}`}
                onClick={(event: MouseEvent<HTMLElement>) => {
                    // The button sits on the chat link: do not open the chat.
                    event.preventDefault();
                    event.stopPropagation();
                    setView('main');
                    setReturned(false);
                    setAnchorEl(event.currentTarget);
                }}
                aria-label="Chat actions"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <MoreHorizIcon fontSize="small" />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={close}
                onClick={(event) => event.stopPropagation()}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { className: styles.paper }, list: { className: styles.list } }}
            >
                {view === 'main' ? (
                    <div key="main" className={`${styles.view} ${returned ? styles.backIn : ''}`}>
                        {mute && (
                            <p className={styles.status}>
                                {mute.until
                                    ? `Muted until ${formatChatTimestamp(mute.until)}`
                                    : 'Notifications are off'}
                            </p>
                        )}

                        {mute && (
                            <MenuItem className={styles.item} onClick={() => run(actions.unmute)}>
                                <ListItemIcon className={styles.icon}>
                                    <NotificationsActiveOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Enable notifications</ListItemText>
                            </MenuItem>
                        )}

                        <MenuItem className={styles.item} onClick={() => setView('durations')}>
                            <ListItemIcon className={styles.icon}>
                                <ScheduleOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Mute for…</ListItemText>
                            <ChevronRightIcon fontSize="small" className={styles.chevron} />
                        </MenuItem>

                        {(!mute || mute.until) && (
                            <MenuItem
                                className={`${styles.item} ${styles.danger}`}
                                onClick={() => run(() => actions.mute('forever'))}
                            >
                                <ListItemIcon className={styles.icon}>
                                    <NotificationsOffOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Disable notifications</ListItemText>
                            </MenuItem>
                        )}
                    </div>
                ) : (
                    <div key="durations" className={`${styles.view} ${styles.forward}`}>
                        <MenuItem
                            className={`${styles.item} ${styles.back}`}
                            onClick={() => {
                                setView('main');
                                setReturned(true);
                            }}
                        >
                            <ListItemIcon className={styles.icon}>
                                <ArrowBackIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Mute for</ListItemText>
                        </MenuItem>

                        {DURATIONS.map(({ value, label }) => (
                            <MenuItem
                                key={value}
                                className={styles.item}
                                onClick={() => run(() => actions.mute(value))}
                            >
                                <ListItemIcon className={styles.icon}>
                                    <TimerOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>{label}</ListItemText>
                            </MenuItem>
                        ))}
                    </div>
                )}
            </Menu>
        </>
    );
}
