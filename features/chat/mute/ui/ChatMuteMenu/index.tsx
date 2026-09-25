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
import { useChatMute } from '../../model/useChatMute';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';

const DURATIONS: Exclude<MuteDuration, 'forever'>[] = ['15m', '30m', '1h', '8h', '1d', '1w'];

type ChatMuteMenuProps = {
    chatId: number;
    /** Current mute, already checked for expiry. */
    mute: ChatMuteState | null;
    className?: string;
};

/** "⋯" menu of a chat row: mute for a while (Telegram-style submenu) or turn notifications off. */
export function ChatMuteMenu({ chatId, mute, className }: ChatMuteMenuProps) {
    const t = useTranslations('chats.mute');
    const format = useFormatters();
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
                aria-label={t('actions')}
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
                                    ? t('mutedUntil', { date: format.chatTimestamp(mute.until) })
                                    : t('off')}
                            </p>
                        )}

                        {mute && (
                            <MenuItem className={styles.item} onClick={() => run(actions.unmute)}>
                                <ListItemIcon className={styles.icon}>
                                    <NotificationsActiveOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>{t('enable')}</ListItemText>
                            </MenuItem>
                        )}

                        <MenuItem className={styles.item} onClick={() => setView('durations')}>
                            <ListItemIcon className={styles.icon}>
                                <ScheduleOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>{t('muteForMenu')}</ListItemText>
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
                                <ListItemText>{t('disable')}</ListItemText>
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
                            <ListItemText>{t('muteFor')}</ListItemText>
                        </MenuItem>

                        {DURATIONS.map((value) => (
                            <MenuItem
                                key={value}
                                className={styles.item}
                                onClick={() => run(() => actions.mute(value))}
                            >
                                <ListItemIcon className={styles.icon}>
                                    <TimerOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>{t(`durations.${value}`)}</ListItemText>
                            </MenuItem>
                        ))}
                    </div>
                )}
            </Menu>
        </>
    );
}
