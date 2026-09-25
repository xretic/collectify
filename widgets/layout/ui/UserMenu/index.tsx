'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, ListItemIcon, Menu, MenuItem } from '@mui/material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import { LogoutOutlined, SettingsOutlined } from '@mui/icons-material';
import { authApi } from '@/entities/auth/api/authApi';
import { isStaff, type SessionUser } from '@/entities/user/model/types';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

export function UserMenu({ user }: { user: SessionUser }) {
    const t = useTranslations('nav');
    const router = useRouter();
    const queryClient = useQueryClient();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const close = () => setAnchorEl(null);

    const handleLogout = async () => {
        close();

        try {
            await authApi.logout();
            queryClient.clear();
            queryClient.setQueryData(sessionUserQueryKey, null);
            router.push('/');
        } catch (error) {
            toast.error(await getApiErrorMessage(error));
        }
    };

    const handleStopImpersonation = async () => {
        close();

        try {
            const admin = await authApi.stopImpersonation();
            queryClient.clear();
            queryClient.setQueryData(sessionUserQueryKey, admin);
            router.push('/management');
        } catch (error) {
            toast.error(await getApiErrorMessage(error));
        }
    };

    const links = [
        {
            href: '/users/me',
            label: t('profile'),
            icon: <AccountCircleOutlinedIcon fontSize="small" />,
        },
        {
            href: '/collections/my',
            label: t('collections'),
            icon: <LibraryBooksOutlinedIcon fontSize="small" />,
        },
        ...(isStaff(user.roles)
            ? [
                  {
                      href: '/management',
                      label: t('management'),
                      icon: <SecurityOutlinedIcon fontSize="small" />,
                  },
              ]
            : []),
        { href: '/settings', label: t('settings'), icon: <SettingsOutlined fontSize="small" /> },
    ];

    return (
        <>
            <button
                type="button"
                className={styles.trigger}
                onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
                aria-haspopup="menu"
                aria-label={t('accountMenu')}
            >
                <span className={styles.username}>{user.username}</span>
                <Avatar alt={user.username} src={user.avatarUrl} className={styles.avatar} />
            </button>

            <Menu
                anchorEl={anchorEl}
                open={anchorEl !== null}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {user.impersonatorUserId && (
                    <MenuItem onClick={handleStopImpersonation}>
                        <ListItemIcon>
                            <KeyboardReturnOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        {t('returnToAdmin')}
                    </MenuItem>
                )}

                {links.map((link) => (
                    <MenuItem key={link.href} component={Link} href={link.href} onClick={close}>
                        <ListItemIcon>{link.icon}</ListItemIcon>
                        {link.label}
                    </MenuItem>
                ))}

                <MenuItem onClick={handleLogout} className={styles.logout}>
                    <ListItemIcon>
                        <LogoutOutlined fontSize="small" />
                    </ListItemIcon>
                    {t('logout')}
                </MenuItem>
            </Menu>
        </>
    );
}
