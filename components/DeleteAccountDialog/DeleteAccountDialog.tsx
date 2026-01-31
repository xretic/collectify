'use client';

import { useDialogStore } from '@/stores/dialogStore';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import styles from './DeleteAccountDialog.module.css';
import { Input } from 'antd';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/constans';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function DeleteAccountDialog() {
    const router = useRouter();
    const { open, setOpen } = useDialogStore();
    const { user, refreshUser, loading } = useUser();
    const { loadingCount, startLoading, stopLoading } = useUIStore();

    const [password, setPassword] = useState('');
    const [wrongPassword, setWrongPassword] = useState(false);
    const [userProtected, setUserProtected] = useState(true);

    const handleClose = () => {
        setOpen(false);
    };

    const handleConfirm = async () => {
        startLoading();

        const res = await fetch('/api/users/', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: userProtected ? password : '0',
            }),
        });

        if (res.ok) {
            await refreshUser();

            router.replace('/');
        } else {
            setWrongPassword(true);
        }

        stopLoading();
    };

    useEffect(() => {
        setUserProtected(user?.protected ?? true);
    }, [user]);

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle className={styles.title}>
                <WarningAmberOutlinedIcon sx={{ color: '#ff4a4d', marginRight: 1 }} />
                Delete Account
            </DialogTitle>
            <DialogContent>
                <DialogContentText className={styles.description}>
                    This action cannot be undone. This will permanently delete your account, all
                    your collections, and remove your data from our servers.
                </DialogContentText>

                <p className={styles.confirmText}>Type your password to confirm</p>

                <Input.Password
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.password}
                    placeholder="Write your password"
                    maxLength={PASSWORD_MAX_LENGTH}
                    hidden={!userProtected}
                    showCount
                />

                {wrongPassword && (
                    <p className={styles.wrongPassword}>
                        <ErrorOutlineIcon sx={{ width: 19, height: 19, marginRight: 0.3 }} />
                        Wrong password
                    </p>
                )}
            </DialogContent>

            <DialogActions>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClose}
                    sx={{ marginTop: 3, borderRadius: 6, textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleConfirm}
                    disabled={
                        (userProtected && password.length < PASSWORD_MIN_LENGTH) || loadingCount > 0
                    }
                    sx={{
                        marginTop: 3,
                        borderRadius: 6,
                        textTransform: 'none',
                        backgroundColor: '#ff4649',
                    }}
                >
                    Delete account
                </Button>
            </DialogActions>
        </Dialog>
    );
}
