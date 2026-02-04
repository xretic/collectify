'use client';

import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import Menu from '@mui/material/Menu';
import { LogoutOutlined, SettingsOutlined } from '@mui/icons-material';
import { useUIStore } from '@/stores/uiStore';
import { useUser } from '@/context/UserProvider';
import Alert from '@mui/material/Alert';
import { useRouter } from 'next/navigation';

export default function HoverMenu() {
    const { setUser } = useUser();
    const { anchorEl, setAnchorEl, startLoading, stopLoading } = useUIStore();

    const handleClose = (path?: string | null) => {
        setAnchorEl(null);

        if (path) {
            router.push(path);
        }
    };

    const open = Boolean(anchorEl);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            startLoading();
            handleClose();
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            setUser(null);

            router.replace('/');
        } catch {
            stopLoading();
            return (
                <Alert variant="filled" severity="error" sx={{ mt: 2 }}>
                    Something went wrong.
                </Alert>
            );
        } finally {
            stopLoading();
        }
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => handleClose()}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: 'var(--container-color)',
                    },
                },
            }}
        >
            <MenuItem sx={{ color: 'var(--text-color)' }} onClick={() => handleClose('/users/me')}>
                <ListItemIcon sx={{ color: 'var(--text-color)' }}>
                    <AccountCircleOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Profile
            </MenuItem>

            <MenuItem sx={{ color: 'var(--text-color)' }} onClick={() => handleClose('/settings')}>
                <ListItemIcon sx={{ color: 'var(--text-color)' }}>
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
    );
}
