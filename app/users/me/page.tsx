'use client';

import { useUser } from '@/context/UserProvider';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Input } from 'antd';
import React, { useEffect, useState } from 'react';
import {
    DESCRPITION_MAX_LENGTH,
    FULLNAME_MAX_LENGTH,
    PAGE_SIZE,
    USERNAME_MAX_LENGTH,
} from '@/lib/constans';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import { useUIStore } from '@/stores/uiStore';
import { usePaginationStore } from '@/stores/paginationStore';
import CollectionsWrapper from '@/components/CollectionsWrapper/CollectionsWrapper';
import SortBy from '@/components/SortBy/SortBy';
import { IconButton, Tooltip, Button, SnackbarCloseReason, Snackbar } from '@mui/material';
import { useDebounce } from '@/lib/useDebounce';
import styles from '../users.module.css';
import { useRouter } from 'next/navigation';
import { isUsernameValid } from '@/helpers/isUsernameValid';
import { SessionUserInResponse } from '@/types/UserInResponse';

type State = {
    copied: boolean;
    editing: boolean;
    fullName: string;
    username: string;
    description: string;
    bannerUrl: string;
    avatarUrl: string;
    errorMessage: string;
    tab: string;
    cooldown: boolean;
};

export default function ProfilePage() {
    const { user, loading, setUser } = useUser();

    const [state, setState] = useState<State>({
        copied: false,
        editing: false,
        fullName: '',
        username: '',
        description: '',
        bannerUrl: '',
        avatarUrl: '',
        errorMessage: '',
        tab: '',
        cooldown: false,
    });

    const updateState = <K extends keyof State>(key: K, value: State[K]) => {
        setState((prev) => ({ ...prev, [key]: value }));
    };

    const [collections, setCollections] = useState<any[]>([]);
    const { startLoading, stopLoading, sortedBy } = useUIStore();
    const { profilePagination } = usePaginationStore();

    const debouncedPagination = useDebounce(profilePagination, 400);
    const debouncedSortedBy = useDebounce(sortedBy, 400);

    const authorTab = user ? `&authorId=${user.id}` : '';
    const favoritesTab = user ? `&favoritesUserId=${user.id}` : '';

    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && !state.tab) {
            updateState('tab', authorTab);
        }
    }, [user, authorTab, state.tab]);

    const loadCollections = async () => {
        if (!user || !state.tab) return;

        startLoading();

        try {
            const response = await fetch(
                `/api/collections/search/?skip=${debouncedPagination * PAGE_SIZE}&sortedBy=${debouncedSortedBy}${state.tab}`,
            );

            if (response.ok) {
                const data = await response.json();
                setCollections(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (!user || loading || !state.tab) return;
        loadCollections();
    }, [user, loading, state.tab, debouncedPagination, debouncedSortedBy]);

    const handleTabChoice = (choice: 'authorTab' | 'favoritesTab') => {
        updateState('tab', choice === 'authorTab' ? authorTab : favoritesTab);
    };

    if (!user) return null;

    const handleEdit = () => {
        updateState('fullName', user.fullName);
        updateState('username', user.username);
        updateState('description', user.description);
        updateState('bannerUrl', user.bannerUrl);
        updateState('avatarUrl', user.avatarUrl);
        updateState('editing', true);
    };

    const handleCancel = () => updateState('editing', false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(user.username);
        updateState('copied', true);
    };

    const handleClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }

        updateState('copied', false);
    };

    const action = (
        <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

    const waitForUploadcare = (): Promise<any> =>
        new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = setInterval(() => {
                if ((window as any).uploadcare) {
                    clearInterval(interval);
                    resolve((window as any).uploadcare);
                } else if (++attempts >= 10) {
                    clearInterval(interval);
                    reject(new Error('Uploadcare failed to load.'));
                }
            }, 10);
        });

    const handleUpload = async (setUrl: (url: string) => void) => {
        try {
            const uploadcare = await waitForUploadcare();
            uploadcare
                .openDialog(null, { imagesOnly: true, multiple: false, crop: 'free' })
                .done((file: any) => {
                    file.done((info: any) => setUrl(info.cdnUrl));
                });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        updateState('cooldown', true);

        const res = await fetch('/api/users/' + user.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: state.fullName,
                username: state.username,
                description: state.description,
                bannerUrl: state.bannerUrl,
                avatarUrl: state.avatarUrl,
            }),
        });

        setTimeout(() => updateState('cooldown', false), 1000);

        if (res.status === 409) {
            updateState('errorMessage', 'User with this username already exists.');
            setTimeout(() => updateState('errorMessage', ''), 2000);
            return;
        }

        if (!res.ok) return;

        const updatedUser = await res.json();
        const responseUser: SessionUserInResponse = updatedUser.user;

        setUser(responseUser);
        updateState('editing', false);
    };

    return (
        <header className={styles.profile}>
            <Snackbar
                open={state.errorMessage.length > 0}
                autoHideDuration={3000}
                onClose={handleClose}
                message={state.errorMessage}
                action={action}
            />

            <div
                onClick={
                    state.editing
                        ? () => handleUpload((url) => updateState('bannerUrl', url))
                        : undefined
                }
                className={styles[state.editing ? 'cover-editing' : 'cover']}
                style={{
                    backgroundImage: `url(${state.editing ? state.bannerUrl : user.bannerUrl})`,
                }}
            />
            <nav className={styles['nav-bar']}>
                {!state.editing && (
                    <Tooltip title="Edit">
                        <IconButton
                            onClick={handleEdit}
                            type="button"
                            sx={{ p: '6px' }}
                            aria-label="Edit"
                            className={styles['action-btn']}
                        >
                            <EditOutlinedIcon sx={{ color: '#afafaf' }} />
                        </IconButton>
                    </Tooltip>
                )}

                {state.editing && (
                    <div className={styles['editing-buttons']}>
                        <Tooltip title="Accept">
                            <IconButton
                                onClick={handleSave}
                                type="button"
                                sx={{ p: '6px' }}
                                aria-label="Accept"
                                className={styles['confim-btn']}
                                disabled={
                                    !state.fullName.trim() ||
                                    !state.username.trim() ||
                                    !isUsernameValid(state.username) ||
                                    state.fullName.length > FULLNAME_MAX_LENGTH ||
                                    state.description.length > DESCRPITION_MAX_LENGTH ||
                                    state.cooldown
                                }
                            >
                                <CheckIcon sx={{ color: '#afafaf' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Cancel changes">
                            <IconButton
                                onClick={handleCancel}
                                type="button"
                                sx={{ p: '6px' }}
                                aria-label="Cancel"
                                className={styles['close-btn']}
                            >
                                <CloseIcon sx={{ color: '#afafaf' }} />
                            </IconButton>
                        </Tooltip>
                    </div>
                )}

                <div className={styles.header}>
                    <Avatar
                        className={styles[state.editing ? 'avatar-editing' : 'avatar']}
                        src={state.editing ? state.avatarUrl : user.avatarUrl}
                        alt={user.username}
                        onClick={
                            state.editing
                                ? () => handleUpload((url) => updateState('avatarUrl', url))
                                : undefined
                        }
                    />
                    <div className={styles.info}>
                        {state.editing ? (
                            <>
                                <Input
                                    value={state.fullName}
                                    onChange={(e) => updateState('fullName', e.target.value)}
                                    placeholder="Full Name"
                                    style={{ bottom: 10, marginBottom: '6px' }}
                                />
                                <Input
                                    value={state.username}
                                    onChange={(e) => updateState('username', e.target.value)}
                                    placeholder="@username"
                                    maxLength={USERNAME_MAX_LENGTH}
                                    style={{ bottom: 10, marginBottom: '6px' }}
                                />
                                <Input.TextArea
                                    value={state.description}
                                    onChange={(e) => updateState('description', e.target.value)}
                                    placeholder="Description"
                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                    style={{ bottom: 10, marginBottom: '6px' }}
                                />
                            </>
                        ) : (
                            <>
                                <h1 className={styles.name}>{user.fullName}</h1>
                                <span onClick={handleCopy} className={styles['username']}>
                                    @{user.username}
                                </span>

                                <Snackbar
                                    open={state.copied}
                                    autoHideDuration={2000}
                                    onClose={handleClose}
                                    message="Username copied."
                                    action={action}
                                />

                                <p className={styles.description}>
                                    <FormatQuoteIcon />
                                    {user.description.length > 0 ? user.description : 'No bio yet'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <div className={styles['collections-category']}>
                <Button
                    variant={state.tab === authorTab ? 'contained' : 'outlined'}
                    onClick={() => handleTabChoice('authorTab')}
                    sx={{
                        borderRadius: 10,
                    }}
                >
                    <AutoAwesomeMosaicIcon sx={{ width: 18, height: 18 }} />
                    <span className={styles['category-text']}>Created</span>
                </Button>

                <Button
                    variant={state.tab === favoritesTab ? 'contained' : 'outlined'}
                    onClick={() => handleTabChoice('favoritesTab')}
                    sx={{ borderRadius: 10 }}
                >
                    <BookmarksIcon
                        sx={{
                            width: 18,
                            height: 18,
                        }}
                    />
                    <span className={styles['category-text']}>Favorites</span>
                </Button>

                <SortBy
                    className={styles['collections-search']}
                    disabled={collections.length === 0}
                />
            </div>

            <div className={styles['before-collections-line']} />

            <div className={styles['collections-wrapper']}>
                <CollectionsWrapper collections={collections} page="profile" />
            </div>
        </header>
    );
}
