'use client';

import Image from 'next/image';
import { Button } from 'antd';
import { LoginRounded } from '@mui/icons-material';
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
import { IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import styles from './NavBar.module.css';

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
                        <Link
                            className={
                                styles[
                                    pathname === '/' ? 'navigation-button-in' : 'navigation-button'
                                ]
                            }
                            href="/"
                        >
                            {pathname === '/' ? (
                                <HomeIcon sx={buttonStyle} />
                            ) : (
                                <HomeOutlinedIcon sx={buttonStyle} />
                            )}
                            <span className="nav-text ml-0.5">Home</span>
                        </Link>

                        {user && (
                            <Link
                                className={
                                    styles[
                                        pathname === '/users/me'
                                            ? 'navigation-button-in'
                                            : 'navigation-button'
                                    ]
                                }
                                href="/users/me"
                            >
                                {pathname === '/users/me' ? (
                                    <AccountCircleIcon sx={buttonStyle} />
                                ) : (
                                    <AccountCircleOutlinedIcon sx={buttonStyle} />
                                )}
                                <span className="nav-text ml-0.5">Profile</span>
                            </Link>
                        )}

                        <Link
                            className={
                                styles[
                                    pathname === '/notifications'
                                        ? 'navigation-button-in'
                                        : 'navigation-button'
                                ]
                            }
                            href="/notifications"
                        >
                            {pathname === '/notifications' ? (
                                <NotificationsIcon sx={buttonStyle} />
                            ) : (
                                <NotificationsOutlinedIcon sx={buttonStyle} />
                            )}
                            <span className="nav-text ml-0.5">Notifications</span>
                        </Link>
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
