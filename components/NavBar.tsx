'use client';

import Image from 'next/image';
import { Button } from 'antd';
import { LoginRounded } from '@mui/icons-material';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import { useUser } from '@/context/UserProvider';
import Avatar from '@mui/material/Avatar';
import { useUIStore } from '@/stores/uiStore';
import HoverMenu from './HoverMenu';

export default function NavBar() {
    const { user, loading } = useUser();
    const { anchorEl, setAnchorEl } = useUIStore();

    if (loading) return null;

    return (
        <header>
            <nav className="nav-bar">
                <a href="/">
                    <Image
                        className="nav-bar-icon"
                        src="/icon.svg"
                        alt="Collectify icon"
                        width={35}
                        height={35}
                    />
                </a>
                <a className="nav-bar-title" href="/">
                    Collectify
                </a>
                {user ? (
                    <div
                        onClick={(event) => {
                            if (anchorEl === event.currentTarget) {
                                setAnchorEl(null);
                            } else {
                                setAnchorEl(event.currentTarget);
                            }
                        }}
                        className="auth-panel"
                    >
                        <span className="font-medium text-gray-800">{user.username}</span>
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
                    <div className="auth-panel">
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
            </nav>
        </header>
    );
}
