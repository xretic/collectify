'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, Badge } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import type { SessionUser } from '@/entities/user/model/types';
import { promptSignIn } from '@/features/auth/model/authPromptStore';
import { withNext } from '@/shared/lib/safeNextPath';
import { useSearchDialogStore } from '@/widgets/global-search/model/searchDialogStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Focused screens (a chat thread, onboarding, auth, moderation) get the whole screen. */
const HIDDEN_ON = [/^\/chats\/.+/, /^\/onboarding$/, /^\/auth\//, /^\/management$/];

type TabProps = {
    label: string;
    active?: boolean;
    children: ReactNode;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

function Tab({ label, active = false, href, onClick, children }: TabProps) {
    const className = `${styles.tab} ${active ? styles.active : ''}`;

    return href ? (
        <Link
            href={href}
            className={className}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
        >
            {children}
        </Link>
    ) : (
        <button type="button" className={className} onClick={onClick} aria-label={label}>
            {children}
        </button>
    );
}

/** Phone navigation at the thumb: Home, Search, Create, Notifications, Profile. */
export function MobileTabBar({ user, loading }: { user: SessionUser | null; loading: boolean }) {
    const t = useTranslations('nav');
    const ta = useTranslations('auth');
    const pathname = usePathname();
    const showSearch = useSearchDialogStore((state) => state.show);

    if (loading || HIDDEN_ON.some((pattern) => pattern.test(pathname))) return null;

    const create = (
        <span className={styles.create}>
            <AddIcon />
        </span>
    );

    return (
        <nav className={styles.bar} aria-label={t('mobileNav')} data-tabbar>
            <Tab href="/" label={t('home')} active={pathname === '/'}>
                {pathname === '/' ? <HomeIcon /> : <HomeOutlinedIcon />}
            </Tab>

            <Tab onClick={showSearch} label={t('search')}>
                <SearchIcon />
            </Tab>

            {user ? (
                <Tab href="/collections/create" label={t('createCollection')}>
                    {create}
                </Tab>
            ) : (
                <Tab onClick={() => promptSignIn('create')} label={t('createCollection')}>
                    {create}
                </Tab>
            )}

            {user ? (
                <>
                    <Tab
                        href="/notifications"
                        label={t('notifications')}
                        active={pathname === '/notifications'}
                    >
                        <Badge
                            badgeContent={user.notifications}
                            max={99}
                            color="error"
                            invisible={!user.notifications}
                        >
                            {pathname === '/notifications' ? (
                                <NotificationsIcon />
                            ) : (
                                <NotificationsOutlinedIcon />
                            )}
                        </Badge>
                    </Tab>

                    <Tab href="/users/me" label={t('profile')} active={pathname === '/users/me'}>
                        <Avatar src={user.avatarUrl} alt="" className={styles.avatar} />
                    </Tab>
                </>
            ) : (
                <Tab href={withNext('/auth/login', pathname)} label={ta('login')}>
                    <LoginRoundedIcon />
                </Tab>
            )}
        </nav>
    );
}
