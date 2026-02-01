'use client';

import { Input } from 'antd';
import styles from './settings.module.css';
import PersonIcon from '@mui/icons-material/Person';
import { useUser } from '@/context/UserProvider';
import {
    DESCRPITION_MAX_LENGTH,
    FULLNAME_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    USERNAME_MAX_LENGTH,
} from '@/lib/constans';
import React, { useEffect, useState } from 'react';
import { Button, IconButton, Snackbar, SnackbarCloseReason } from '@mui/material';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useDialogStore } from '@/stores/dialogStore';
import DeleteAccountDialog from '@/components/DeleteAccountDialog/DeleteAccountDialog';
import { useUIStore } from '@/stores/uiStore';
import { SessionUserInResponse } from '@/types/UserInResponse';
import CloseIcon from '@mui/icons-material/Close';
import { isUsernameValid } from '@/helpers/isUsernameValid';

type GlobalState = {
    fullName: string;
    username: string;
    description: string;
};

type PrivateState = {
    oldPassword: string;
    newPassword: string;
    confirmPassoword: string;
};

export default function SettingsPage() {
    const { user, loading, setUser } = useUser();
    const { startLoading, stopLoading, loadingCount } = useUIStore();

    const [state, setState] = useState<GlobalState>({
        fullName: '',
        username: '',
        description: '',
    });

    const [privateState, setPrivate] = useState<PrivateState>({
        oldPassword: '',
        newPassword: '',
        confirmPassoword: '',
    });

    const [errorMessage, setErrorMessage] = useState('');

    const { setOpen } = useDialogStore();

    const updateState = <K extends keyof GlobalState>(key: K, value: GlobalState[K]) => {
        setState((prev) => ({ ...prev, [key]: value }));
    };

    const updatePrivateState = <K extends keyof PrivateState>(key: K, value: PrivateState[K]) => {
        setPrivate((prev) => ({ ...prev, [key]: value }));
    };

    const handleOpenDialog = () => {
        setOpen(true);
    };

    const handleProfileUpdate = async () => {
        startLoading();

        const response = await fetch('/api/users/' + user!.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: state.fullName,
                username: state.username,
                description: state.description,
            }),
        });

        const responseJson = await response.json();
        stopLoading();

        if (!response.ok) {
            setErrorMessage(responseJson.message);
            return;
        }

        const responseUser: SessionUserInResponse = responseJson.user;

        setUser(responseUser);
    };

    useEffect(() => {
        if (user) {
            setState((prev) => ({
                ...prev,
                fullName: user.fullName,
                username: user.username,
                description: user.description,
            }));
        }
    }, [user]);

    const handleClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }

        setErrorMessage('');
    };

    const action = (
        <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

    if (loading) return null;

    return (
        <>
            <Snackbar
                open={errorMessage.length > 0}
                autoHideDuration={3000}
                onClose={handleClose}
                message={errorMessage}
                action={action}
            />

            <header className={styles.header}>
                <h1 className={styles.settings}>Settings</h1>
                <p className={styles.description}>Manage your account settings and preferences</p>
            </header>

            <div className={styles.container}>
                <p>
                    <PersonIcon sx={{ color: '#208fff' }} />
                    <span className={styles.profileTitle}>Profile</span>
                </p>

                <div className={styles.option}>
                    <span>Full name</span>
                    <Input
                        onChange={(x) => updateState('fullName', x.target.value)}
                        status={state.fullName === '' ? 'error' : 'validating'}
                        className={styles.profileInput}
                        placeholder="Write new full name"
                        defaultValue={user?.fullName}
                        maxLength={FULLNAME_MAX_LENGTH}
                        showCount
                    />
                </div>

                <div className={styles.option}>
                    <span>Username</span>
                    <Input
                        onChange={(x) => updateState('username', x.target.value)}
                        className={styles.profileInput}
                        placeholder="Write new username"
                        defaultValue={user?.username}
                        maxLength={USERNAME_MAX_LENGTH}
                        showCount
                    />
                </div>

                <div className={styles.option}>
                    <span>Description</span>
                    <Input
                        onChange={(x) => updateState('description', x.target.value)}
                        className={styles.profileInput}
                        placeholder="Write new description"
                        defaultValue={user?.description}
                        maxLength={DESCRPITION_MAX_LENGTH}
                        showCount
                    />
                </div>

                <Button
                    onClick={handleProfileUpdate}
                    variant="contained"
                    size="small"
                    disabled={
                        !state.fullName.trim() ||
                        !isUsernameValid(state.username) ||
                        (state.fullName === user?.fullName &&
                            state.username === user.username &&
                            state.description === user.description) ||
                        loadingCount > 0
                    }
                    sx={{ marginTop: 3, borderRadius: 6, textTransform: 'none' }}
                >
                    Save changes
                </Button>
            </div>

            <div className={styles.container} style={{ marginTop: 20 }}>
                <p>
                    <KeyOutlinedIcon sx={{ color: '#208fff' }} />
                    <span className={styles.profileTitle}>Privacy & Security</span>
                </p>

                <div className={styles.option}>
                    <span>Change password</span>
                    <Input.Password
                        onChange={(x) => updatePrivateState('oldPassword', x.target.value)}
                        className={styles.profileInput}
                        placeholder="Current password"
                        maxLength={PASSWORD_MAX_LENGTH}
                        showCount
                    />
                    <Input.Password
                        onChange={(x) => updatePrivateState('newPassword', x.target.value)}
                        className={styles.profileInput}
                        placeholder="New password"
                        maxLength={PASSWORD_MAX_LENGTH}
                        showCount
                    />
                    <Input.Password
                        onChange={(x) => updatePrivateState('confirmPassoword', x.target.value)}
                        className={styles.profileInput}
                        placeholder="Confirm new password"
                        maxLength={PASSWORD_MAX_LENGTH}
                        showCount
                    />
                </div>

                <Button
                    variant="contained"
                    size="small"
                    disabled={
                        privateState.confirmPassoword === '' ||
                        privateState.newPassword === '' ||
                        privateState.oldPassword === ''
                    }
                    sx={{ marginTop: 3, borderRadius: 6, textTransform: 'none' }}
                >
                    Update changes
                </Button>
            </div>

            <div
                className={styles.container}
                style={{
                    marginTop: 20,
                    borderColor: '#ff6e70',
                }}
            >
                <p>
                    <ShieldOutlinedIcon sx={{ color: 'red' }} />
                    <span className={styles.profileTitle}>Danger zone</span>
                </p>

                <div className={styles.option}>
                    <span>Permanently delete your account and all data</span>
                </div>

                <Button
                    onClick={handleOpenDialog}
                    variant="contained"
                    size="small"
                    sx={{
                        marginTop: 3,
                        borderRadius: 6,
                        textTransform: 'none',
                        backgroundColor: '#ff4649',
                    }}
                >
                    Delete
                </Button>
            </div>

            <DeleteAccountDialog />
        </>
    );
}
