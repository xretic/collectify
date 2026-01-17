'use client';

import Image from 'next/image';
import { Button } from 'antd';
import { LoginRounded, LogoutOutlined, SettingsOutlined } from '@mui/icons-material';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import { useUser } from '@/context/UserProvider';
import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ListItemIcon from '@mui/material/ListItemIcon';
import CircularProgress from '@mui/material/CircularProgress';

export default function NavBar() {
    const { user, setUser, loading } = useUser();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClose = () => setAnchorEl(null);

    const handleLogout = async () => {
        handleClose();
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        setUser(null);
    };

    if (loading) {
        return (
            <header className="navBar flex justify-center items-center h-16">
                <CircularProgress />
            </header>
        );
    }

    return (
        <header>
            <nav className="navBar">
                <a href="/">
                    <Image
                        className="navBarIcon"
                        src="/icon.svg"
                        alt="Collectify icon"
                        width={35}
                        height={35}
                    />
                </a>
                <a className="navBarTitle" href="/">
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
                        className="authPanel"
                    >
                        <span className="font-medium text-gray-800">{user.name}</span>
                        <Avatar alt={user.name} src={user.avatarUrl} sx={{ width: 36, height: 36 }}>
                            {user.name[0]}
                        </Avatar>

                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <AccountCircleOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                Profile
                            </MenuItem>

                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <SettingsOutlined fontSize="small" />
                                </ListItemIcon>
                                Settings
                            </MenuItem>

                            <MenuItem
                                onClick={handleLogout}
                                sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                        backgroundColor: 'light',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: 'error.main' }}>
                                    <LogoutOutlined fontSize="small" />
                                </ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </div>
                ) : (
                    <div className="authPanel">
                        <Button
                            className="loginBtn"
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
