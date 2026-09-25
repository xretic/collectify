'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Button, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { sessionUserQueryKey, useSessionUser } from '@/entities/user/model/useSessionUser';
import { useRealtimeEvent } from '@/shared/lib/realtime/RealtimeProvider';
import { useActiveChatStore } from '@/features/chat/model/activeChatStore';
import UserSearchBar from '../UserSearchBar';
import { UserMenu } from '../UserMenu';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { getNavItems } from './navItems';
import { NavItemIcon } from './NavItemIcon';
import { NavDrawer } from './NavDrawer';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

export default function NavBar() {
    const t = useTranslations('nav');
    const ta = useTranslations('auth');
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const { user, loading, setUser } = useSessionUser();
    const activeChatId = useActiveChatStore((state) => state.activeChatId);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const items = getNavItems(user);

    useRealtimeEvent('message:new', (message) => {
        if (message.author.id === user?.id) return;
        // An open chat reads it right away, unless the tab is in the background.
        if (message.chatId === activeChatId && document.visibilityState === 'visible') return;
        setUser((prev) => (prev ? { ...prev, unreadMessages: prev.unreadMessages + 1 } : prev));
    });

    // Read in another tab / device.
    useRealtimeEvent('chat:read', ({ readerId }) => {
        if (readerId === user?.id) queryClient.invalidateQueries({ queryKey: sessionUserQueryKey });
    });

    return (
        <header className={styles.header}>
            {user?.impersonatorUserId && <ImpersonationBanner username={user.username} />}

            <nav className={styles.bar}>
                <div className={styles.brand}>
                    {user && (
                        <IconButton
                            className={styles.drawerToggle}
                            onClick={() => setDrawerOpen(true)}
                            aria-label={t('openMenu')}
                        >
                            <Badge color="error" variant="dot" invisible={!user.notifications}>
                                <MenuIcon />
                            </Badge>
                        </IconButton>
                    )}

                    <Link href="/" className={styles.logo}>
                        <Image src="/icon.svg" alt="" width={35} height={35} priority />
                        <span className={styles.title}>Collectify</span>
                    </Link>
                </div>

                {user && (
                    <div className={styles.links}>
                        {items.map((item) => {
                            const active = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${styles.link} ${active ? styles.linkActive : ''}`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <NavItemIcon item={item} active={active} />
                                    <span>{t(item.labelKey)}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div className={styles.actions}>
                    {user && searchOpen && <UserSearchBar onClose={() => setSearchOpen(false)} />}

                    {user && !searchOpen && (
                        <>
                            <Tooltip title={t('createCollection')}>
                                <IconButton
                                    component={Link}
                                    href="/collections/create"
                                    aria-label={t('createCollection')}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={t('chats')}>
                                <IconButton component={Link} href="/chats" aria-label={t('chats')}>
                                    <Badge
                                        badgeContent={user.unreadMessages}
                                        max={99}
                                        color="error"
                                    >
                                        <EmailOutlinedIcon />
                                    </Badge>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={t('findUser')}>
                                <IconButton
                                    onClick={() => setSearchOpen(true)}
                                    aria-label={t('findUser')}
                                >
                                    <SearchIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}

                    {user && <UserMenu user={user} />}

                    {!user && !loading && (
                        <div className={styles.auth}>
                            <Button variant="contained" component={Link} href="/auth/login">
                                {ta('login')}
                            </Button>
                            <Button variant="outlined" component={Link} href="/auth/register">
                                {ta('register')}
                            </Button>
                        </div>
                    )}
                </div>
            </nav>

            {user && (
                <NavDrawer
                    open={drawerOpen}
                    items={items}
                    pathname={pathname}
                    onClose={() => setDrawerOpen(false)}
                />
            )}
        </header>
    );
}
