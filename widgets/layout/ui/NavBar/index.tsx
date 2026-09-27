'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Button, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { sessionUserQueryKey, useSessionUser } from '@/entities/user/model/useSessionUser';
import { useRealtimeEvent } from '@/shared/lib/realtime/RealtimeProvider';
import { useActiveChatStore } from '@/features/chat/model/activeChatStore';
import { GlobalSearch } from '@/widgets/global-search/ui/GlobalSearch';
import { UserMenu } from '../UserMenu';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { VerifyEmailBanner } from '../VerifyEmailBanner';
import { MobileTabBar } from '../MobileTabBar';
import { SearchTrigger } from '../SearchTrigger';
import { getNavItems } from './navItems';
import { NavItemIcon } from './NavItemIcon';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Publishes the header's height (banners included) as `--header-height` for sticky / full-height layouts. */
function useHeaderHeight() {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const header = ref.current;
        if (!header) return;

        const observer = new ResizeObserver(([entry]) => {
            const height = Math.round(entry.borderBoxSize[0]?.blockSize ?? header.offsetHeight);
            document.documentElement.style.setProperty('--header-height', `${height}px`);
        });

        observer.observe(header);
        return () => observer.disconnect();
    }, []);

    return ref;
}

export default function NavBar() {
    const t = useTranslations('nav');
    const ta = useTranslations('auth');
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const { user, loading, setUser } = useSessionUser();
    const activeChatId = useActiveChatStore((state) => state.activeChatId);
    const headerRef = useHeaderHeight();

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
        <>
            <header ref={headerRef} className={styles.header}>
                {user?.impersonatorUserId && <ImpersonationBanner username={user.username} />}
                {user?.email && !user.emailVerified && !user.impersonatorUserId && (
                    <VerifyEmailBanner email={user.email} />
                )}

                <nav className={styles.bar}>
                    <Link href="/" className={styles.logo}>
                        <Image src="/icon.svg" alt="" width={35} height={35} priority />
                        <span className={styles.title}>Collectify</span>
                    </Link>

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
                                        title={t(item.labelKey)}
                                    >
                                        <NavItemIcon item={item} active={active} />
                                        <span className={styles.linkLabel}>{t(item.labelKey)}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <SearchTrigger className={styles.search} />

                        {user && (
                            <>
                                <Tooltip title={t('createCollection')}>
                                    <IconButton
                                        component={Link}
                                        href="/collections/create"
                                        aria-label={t('createCollection')}
                                        className={styles.desktopOnly}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title={t('chats')}>
                                    <IconButton
                                        component={Link}
                                        href="/chats"
                                        aria-label={t('chats')}
                                    >
                                        <Badge
                                            badgeContent={user.unreadMessages}
                                            max={99}
                                            color="error"
                                        >
                                            <EmailOutlinedIcon />
                                        </Badge>
                                    </IconButton>
                                </Tooltip>

                                <UserMenu user={user} />
                            </>
                        )}

                        {!user && !loading && (
                            <div className={styles.auth}>
                                <Button variant="contained" component={Link} href="/auth/register">
                                    {ta('register')}
                                </Button>
                                <Button variant="outlined" component={Link} href="/auth/login">
                                    {ta('login')}
                                </Button>
                            </div>
                        )}
                    </div>
                </nav>
            </header>

            <MobileTabBar user={user} loading={loading} />
            <GlobalSearch />
        </>
    );
}
