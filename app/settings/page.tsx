'use client';

import { ConfigProvider, Input, Select } from 'antd';
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
import { useDialogStore } from '@/stores/dialogs/dialogStore';
import DeleteAccountDialog from '@/components/features/settings/DeleteAccountDialog';
import { useUIStore } from '@/stores/uiStore';
import { SessionUserInResponse } from '@/types/UserInResponse';
import CloseIcon from '@mui/icons-material/Close';
import { isUsernameValid } from '@/helpers/isUsernameValid';
import { isPasswordValid } from '@/helpers/isPasswordValid';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useTheme } from '@/lib/useTheme';
import { api } from '@/lib/api';

type GlobalState = {
    fullName: string;
    username: string;
    description: string;
};

type PrivateState = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export default function SettingsPage() {
    const { user, loading, setUser } = useUser();
    const { startLoading, stopLoading, loadingCount } = useUIStore();
    const [userProtected, setUserProtected] = useState(true);

    const [state, setState] = useState<GlobalState>({
        fullName: '',
        username: '',
        description: '',
    });

    const [privateState, setPrivate] = useState<PrivateState>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const { theme, changeTheme } = useTheme();

    const [errorMessage, setErrorMessage] = useState('');
    const { setOpen } = useDialogStore();

    const inputStyle: Record<string, string> = {
        backgroundColor: 'var(--container-color)',
        color: 'var(--text-color)',
        borderColor: 'var(--border-color)',
    };

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

        try {
            const data = await api
                .patch('api/users/', {
                    json: {
                        fullName: state.fullName,
                        username: state.username,
                        description: state.description,
                    },
                })
                .json<{ user: SessionUserInResponse }>();

            setUser(data.user);
        } catch (err: any) {
            const data = await err.response.json();
            setErrorMessage(data.message);
            return;
        } finally {
            stopLoading();
        }
    };

    const handlePasswordChange = async () => {
        startLoading();
        setErrorMessage('');

        try {
            const data = await api
                .patch('api/users/auth', {
                    json: {
                        currentPassword: privateState.currentPassword,
                        newPassword: privateState.newPassword,
                        confirmPassword: privateState.confirmPassword,
                    },
                })
                .json<{ user: SessionUserInResponse }>();

            setPrivate((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));

            setUser(data.user);
        } catch (err: any) {
            const data = await err.response.json();
            setErrorMessage(data.message);
            return;
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (user) {
            setState((prev) => ({
                ...prev,
                fullName: user.fullName,
                username: user.username,
                description: user.description,
            }));

            setUserProtected(user.protected);
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

    if (loading && !user) return null;

    return (
        <>
            <ConfigProvider
                theme={{
                    token: {
                        colorTextPlaceholder: 'var(--soft-text)',
                        colorIcon: 'var(--text-color)',
                        colorIconHover: 'var(--text-color)',
                    },
                }}
            >
                <Snackbar
                    open={errorMessage.length > 0}
                    autoHideDuration={3000}
                    onClose={handleClose}
                    message={errorMessage}
                    action={action}
                />

                <header className={styles.header}>
                    <h1 className={styles.settings}>Settings</h1>
                    <p className={styles.description}>
                        Manage your account settings and preferences
                    </p>
                </header>

                <div className={styles.container}>
                    <p>
                        <PersonIcon sx={{ color: '#208fff' }} />
                        <span className={styles.title}>Profile</span>
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
                            style={inputStyle}
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
                            style={inputStyle}
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
                            style={inputStyle}
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
                        <span className={styles.title}>Privacy & Security</span>
                    </p>

                    <div className={styles.option}>
                        <span>Change password</span>

                        {userProtected && (
                            <Input.Password
                                onChange={(x) =>
                                    updatePrivateState('currentPassword', x.target.value)
                                }
                                className={styles.profileInput}
                                value={privateState.currentPassword}
                                placeholder="Current password"
                                maxLength={PASSWORD_MAX_LENGTH}
                                style={inputStyle}
                                showCount
                            />
                        )}

                        <Input.Password
                            onChange={(x) => updatePrivateState('newPassword', x.target.value)}
                            className={styles.profileInput}
                            value={privateState.newPassword}
                            placeholder="New password"
                            maxLength={PASSWORD_MAX_LENGTH}
                            style={inputStyle}
                            showCount
                        />
                        <Input.Password
                            onChange={(x) => updatePrivateState('confirmPassword', x.target.value)}
                            className={styles.profileInput}
                            value={privateState.confirmPassword}
                            placeholder="Confirm new password"
                            maxLength={PASSWORD_MAX_LENGTH}
                            style={inputStyle}
                            showCount
                        />
                    </div>

                    <Button
                        onClick={handlePasswordChange}
                        variant="contained"
                        size="small"
                        disabled={
                            !isPasswordValid(privateState.confirmPassword) ||
                            !isPasswordValid(privateState.newPassword) ||
                            (!isPasswordValid(privateState.currentPassword) && userProtected)
                        }
                        sx={{ marginTop: 3, borderRadius: 6, textTransform: 'none' }}
                    >
                        Change password
                    </Button>
                </div>

                <div className={styles.container}>
                    <p>
                        <ColorLensIcon sx={{ color: '#208fff' }} />
                        <span className={styles.title}>Appearance</span>
                    </p>

                    <div className={styles.option}>
                        <span>Theme</span>
                        <>
                            <ConfigProvider
                                theme={{
                                    token: {
                                        colorBgElevated: 'var(--text-color)',
                                        colorText: 'var(--text-color)',
                                        colorPrimary: 'var(--accent)',
                                        colorFillAlter: 'var(--soft-text)',
                                        colorBgContainer: 'var(--accent)',
                                        controlItemBgHover: 'var(--accent)',
                                        controlItemBgActive: 'var(--border-color)',
                                    },
                                    components: {
                                        Select: {
                                            selectorBg: 'var(--accent)',
                                            hoverBorderColor: 'var(--accent)',
                                            activeBorderColor: 'var(--accent)',
                                        },
                                    },
                                }}
                            >
                                <Select
                                    value={theme}
                                    style={{
                                        width: '100%',
                                        ...inputStyle,
                                    }}
                                    onChange={(value: 'dark' | 'light') => changeTheme(value)}
                                    options={[
                                        { value: 'dark', label: 'Dark' },
                                        { value: 'light', label: 'Light' },
                                    ]}
                                    classNames={{
                                        popup: {
                                            root: styles.themeDropdown,
                                        },
                                    }}
                                />
                            </ConfigProvider>
                        </>
                    </div>
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
                        <span className={styles.title}>Danger zone</span>
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

                <DeleteAccountDialog userProtected={userProtected} />
            </ConfigProvider>
        </>
    );
}
