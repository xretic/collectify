'use client';

import Image from 'next/image';
import { Button } from 'antd';
import { LoginRounded } from '@mui/icons-material';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import { useUser } from '@/context/UserProvider';
import Avatar from '@mui/material/Avatar';
import { useUIStore } from '@/stores/uiStore';
import HoverMenu from './HoverMenu';
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

export default function NavBar() {
    const { user, loading } = useUser();
    const { anchorEl, setAnchorEl } = useUIStore();
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
            <nav className="nav-bar">
                <Link href="/">
                    <Image
                        className="nav-bar-icon"
                        src="/icon.svg"
                        alt="Collectify icon"
                        width={35}
                        height={35}
                    />
                </Link>

                <Link className="nav-bar-title" href="/">
                    Collectify
                </Link>

                {user && (
                    <nav className="nav-bar-navigation">
                        <Link
                            className={
                                pathname === '/' ? 'navigation-button-in' : 'navigation-button'
                            }
                            href="/"
                        >
                            {pathname === '/' ? (
                                <HomeIcon sx={buttonStyle} />
                            ) : (
                                <HomeOutlinedIcon sx={buttonStyle} />
                            )}
                            Home
                        </Link>

                        {user && (
                            <Link
                                className={
                                    pathname === '/users/me'
                                        ? 'navigation-button-in'
                                        : 'navigation-button'
                                }
                                href="/users/me"
                            >
                                {pathname === '/users/me' ? (
                                    <AccountCircleIcon sx={buttonStyle} />
                                ) : (
                                    <AccountCircleOutlinedIcon sx={buttonStyle} />
                                )}
                                Profile
                            </Link>
                        )}

                        <Link
                            className={
                                pathname === '/notifications' // TODO: refactor this shit
                                    ? 'navigation-button-in'
                                    : 'navigation-button'
                            }
                            href="/notifications"
                        >
                            {pathname === '/notifications' ? (
                                <NotificationsIcon sx={buttonStyle} />
                            ) : (
                                <NotificationsOutlinedIcon sx={buttonStyle} />
                            )}
                            Notifications
                        </Link>
                    </nav>
                )}

                <div
                    className="nav-right"
                    style={{ display: 'flex', alignItems: 'center', gap: 15 }}
                >
                    {user && (
                        <div
                            className="auth-panel-search-btn"
                            style={{
                                right: 65 + width,
                                top: 15,
                            }}
                        >
                            <SearchIcon sx={{ color: '#afafaf' }} />
                        </div>
                    )}

                    {user ? (
                        <div
                            onClick={(event) =>
                                setAnchorEl(
                                    anchorEl === event.currentTarget ? null : event.currentTarget,
                                )
                            }
                            className="auth-panel"
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <span ref={usernameRef} className="font-medium text-gray-800">
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
                        <div className="auth-panel" style={{ display: 'flex', gap: 10 }}>
                            <Button
                                className="login-btn"
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
