'use client';

import { useDialogStore } from '@/stores/dialogs/dialogStore';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import styles from './index.module.css';
import { ConfigProvider, Input } from 'antd';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/constans';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { api } from '@/lib/api';

interface Props {
    userProtected: boolean;
}

export default function DeleteAccountDialog({ userProtected }: Props) {
    const router = useRouter();
    const { open, setOpen } = useDialogStore();
    const { refreshUser } = useUser();
    const { loadingCount, startLoading, stopLoading } = useUIStore();

    const [password, setPassword] = useState('');
    const [wrongPassword, setWrongPassword] = useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    const handleConfirm = async () => {
        startLoading();

        try {
            await api.delete('api/users/', {
                json: {
                    password: userProtected ? password : '0',
                },
            });

            await refreshUser();
            router.replace('/');
        } catch {
            setWrongPassword(true);
        } finally {
            stopLoading();
        }
    };

    return (
        <Dialog
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: 'var(--container-color)',
                        color: 'var(--text-color)',
                        borderRadius: 3,
                    },
                },
            }}
            open={open}
            onClose={handleClose}
        >
            <DialogTitle sx={{ color: 'var(--text-color)' }} className={styles.title}>
                <WarningAmberOutlinedIcon sx={{ color: '#ff4a4d', marginRight: 1 }} />
                Delete Account
            </DialogTitle>
            <DialogContent>
                <DialogContentText
                    sx={{ color: 'var(--soft-text)' }}
                    className={styles.description}
                >
                    This action cannot be undone. This will permanently delete your account, all
                    your collections, and remove your data from our servers.
                </DialogContentText>

                {userProtected && (
                    <p className={styles.confirmText}>Type your password to confirm</p>
                )}

                <ConfigProvider
                    theme={{
                        token: {
                            colorTextPlaceholder: 'var(--soft-text)',
                            colorIcon: 'var(--soft-text)',
                        },
                    }}
                >
                    <Input.Password
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.password}
                        placeholder="Write your password"
                        maxLength={PASSWORD_MAX_LENGTH}
                        hidden={!userProtected}
                        style={{
                            backgroundColor: 'var(--container-color)',
                            color: 'var(--text-color)',
                        }}
                        showCount
                    />
                </ConfigProvider>

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
