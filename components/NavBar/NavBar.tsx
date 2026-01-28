'use client';

import Image from 'next/image';
import { Button } from 'antd';
import { LoginRounded, SvgIconComponent } from '@mui/icons-material';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import { useUser } from '@/context/UserProvider';
import Avatar from '@mui/material/Avatar';
import { useUIStore } from '@/stores/uiStore';
import HoverMenu from '../HoverMenu/HoverMenu';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { usePathname } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import UserSearchBar from '../UserSearchBar/UserSearchBar';
import { Badge, IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import styles from './NavBar.module.css';
import { SessionUserInResponse } from '@/types/UserInResponse';

interface NavBarProps {
    user: SessionUserInResponse | null;
    pathname: string;
    styles: Record<string, string>;
    buttonStyle?: SxProps<Theme>;
}

interface NavItem {
    label: string;
    href: string;
    icon: SvgIconComponent;
    iconOutlined: SvgIconComponent;
    badge?: number;
    hide?: boolean;
}

const navItems = (user: SessionUserInResponse | null, pathname: string): NavItem[] => [
    {
        label: 'Home',
        href: '/',
        icon: HomeIcon,
        iconOutlined: HomeOutlinedIcon,
    },
    {
        label: 'Profile',
        href: '/users/me',
        icon: AccountCircleIcon,
        iconOutlined: AccountCircleOutlinedIcon,
        hide: !user,
    },
    {
        label: 'Notifications',
        href: '/notifications',
        icon: NotificationsIcon,
        iconOutlined: NotificationsOutlinedIcon,
        badge: user?.notifications,
    },
];

const badgeSx: SxProps<Theme> = {
    '.MuiBadge-badge': {
        minWidth: 14,
        height: 14,
        fontSize: 10,
        padding: 0,
        transform: 'translate(35%, -35%)',
    },
};

export default function NavBar() {
    const { user, loading } = useUser();
    const { anchorEl, setAnchorEl, searchBarOpened, setSearchBarOpened } = useUIStore();
    const pathname = usePathname();
    const buttonStyle = { width: 22, height: 22, marginLeft: 2 };

    const usernameRef = useRef<HTMLSpanElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (usernameRef.current) {
            setWidth(usernameRef.current.offsetWidth);
        }
    }, [user?.username]);

    if (loading) return null;

    return (
        <header>
            <nav className={styles['nav-bar']}>
                <Link href="/">
                    <Image
                        className={styles['nav-bar-icon']}
                        src="/icon.svg"
                        alt="Collectify icon"
                        width={35}
                        height={35}
                    />
                </Link>

                <Link className={styles['nav-bar-title']} href="/">
                    Collectify
                </Link>

                {user && (
                    <nav className={styles['nav-bar-navigation']}>
                        {navItems(user, pathname)
                            .filter((item) => !item.hide)
                            .map(
                                ({
                                    label,
                                    href,
                                    icon: Icon,
                                    iconOutlined: IconOutlined,
                                    badge,
                                }) => {
                                    const isActive = pathname === href;

                                    const content =
                                        badge !== undefined ? (
                                            <Badge
                                                badgeContent={badge}
                                                max={99}
                                                color="error"
                                                anchorOrigin={{
                                                    vertical: 'top',
                                                    horizontal: 'right',
                                                }}
                                                sx={badgeSx}
                                            >
                                                {isActive ? (
                                                    <Icon sx={buttonStyle} />
                                                ) : (
                                                    <IconOutlined sx={buttonStyle} />
                                                )}
                                            </Badge>
                                        ) : isActive ? (
                                            <Icon sx={buttonStyle} />
                                        ) : (
                                            <IconOutlined sx={buttonStyle} />
                                        );

                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            className={
                                                styles[
                                                    isActive
                                                        ? 'navigation-button-in'
                                                        : 'navigation-button'
                                                ]
                                            }
                                        >
                                            {content}
                                            <span
                                                className={`nav-text ml-${badge && badge > 0 ? 1 : 0}`}
                                            >
                                                {label}
                                            </span>
                                        </Link>
                                    );
                                },
                            )}
                    </nav>
                )}

                <div
                    className={styles['nav-right']}
                    style={{ display: 'flex', alignItems: 'center', gap: 15 }}
                >
                    {user && (
                        <div
                            className={styles['auth-panel-search-btn']}
                            style={{
                                right: 65 + width,
                                top: 17,
                            }}
                        >
                            {searchBarOpened ? (
                                <UserSearchBar />
                            ) : (
                                <>
                                    <Tooltip title="Create collection">
                                        <IconButton
                                            type="button"
                                            sx={{ p: '6px' }}
                                            aria-label="search"
                                        >
                                            <AddIcon sx={{ color: '#afafaf' }} />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Search">
                                        <IconButton
                                            onClick={setSearchBarOpened}
                                            type="button"
                                            sx={{ p: '6px' }}
                                            aria-label="search"
                                        >
                                            <SearchIcon sx={{ color: '#afafaf' }} />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    )}

                    {user ? (
                        <div
                            onClick={(event) =>
                                setAnchorEl(
                                    anchorEl === event.currentTarget ? null : event.currentTarget,
                                )
                            }
                            className={styles['auth-panel']}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <span ref={usernameRef} className={styles['nav-right-username']}>
                                {user.username}
                            </span>
                            <Avatar
                                alt={user.username}
                                src={user.avatarUrl}
                                sx={{ width: 36, height: 36 }}
                            >
                                {user.username}
                            </Avatar>
                            <HoverMenu />
                        </div>
                    ) : (
                        <div className={styles['auth-panel']}>
                            <Button
                                className={styles['login-btn']}
                                color="primary"
                                variant="solid"
                                icon={<LoginRounded />}
                                size="large"
                                href="/auth/login"
                            >
                                Login
                            </Button>
                            <Button
                                color="primary"
                                variant="outlined"
                                icon={<ExitToAppOutlinedIcon />}
                                size="large"
                                href="/auth/register"
                            >
                                Register
                            </Button>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}
