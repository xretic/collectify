'use client';

import { useUser } from '@/entities/user/model/UserProvider';
import Avatar from '@mui/material/Avatar';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import LockIcon from '@mui/icons-material/Lock';
import { ConfigProvider, Input } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
    DESCRPITION_MAX_LENGTH,
    FULLNAME_MAX_LENGTH,
    PAGE_SIZE,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from '@/shared/lib/constants';
import { useUIStore } from '@/shared/model/uiStore';
import { usePaginationStore } from '@/shared/model/paginationStore';
import CollectionsWrapper from '@/entities/collection/ui/CollectionsWrapper';
import SortBy from '@/shared/ui/SortBy';
import { IconButton, Tooltip, Button, SnackbarCloseReason, Snackbar } from '@mui/material';
import styles from '@/app/users/users.module.css';
import { useRouter } from 'next/navigation';
import { isUsernameValid } from '@/shared/lib/validation/isUsernameValid';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '@/shared/ui/Loader';
import { handleUpload } from '@/shared/lib/handleUpload';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { userApi } from '@/entities/user/api/userApi';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import UserBadge from '@/shared/ui/UserBadge';

type Tab = 'authorTab' | 'favoritesTab' | 'privateTab';

type State = {
    copied: boolean;
    editing: boolean;
    fullName: string;
    username: string;
    description: string;
    bannerUrl: string;
    avatarUrl: string;
    errorMessage: string;
    tab: Tab;
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
        tab: 'authorTab',
        cooldown: false,
    });

    const updateState = <K extends keyof State>(key: K, value: State[K]) => {
        setState((prev) => ({ ...prev, [key]: value }));
    };

    const { sortedBy } = useUIStore();
    const { profilePagination } = usePaginationStore();
    const disabled =
        !state.fullName.trim() ||
        !isUsernameValid(state.username) ||
        state.fullName.length > FULLNAME_MAX_LENGTH ||
        state.description.length > DESCRPITION_MAX_LENGTH ||
        state.cooldown;

    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/');
        }
    }, [user, loading, router]);

    const params = useMemo(() => {
        return {
            sortedBy: String(sortedBy),
            skip: profilePagination * PAGE_SIZE,
            tab: state.tab,
            userId: user?.id ?? null,
        };
    }, [sortedBy, profilePagination, state.tab, user?.id]);

    const { data, isFetching } = useQuery({
        queryKey: [collectionQueryKeys.meSearch[0], params],
        enabled: !loading && params.userId != null,
        staleTime: 10_000,
        queryFn: () =>
            collectionApi.search({
                sortedBy: params.sortedBy,
                skip: params.skip,
                privateOnly: params.tab === 'privateTab',
                authorId: params.tab !== 'favoritesTab' ? params.userId : null,
                favoritesUserId: params.tab === 'favoritesTab' ? params.userId : null,
            }),
    });

    const collections = data ?? [];

    const handleTabChoice = (choice: Tab) => {
        updateState('tab', choice);
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

    const handleSave = async () => {
        updateState('cooldown', true);

        try {
            const updatedUser = await userApi.updateProfile({
                fullName: state.fullName,
                username: state.username,
                description: state.description,
                bannerUrl: state.bannerUrl,
                avatarUrl: state.avatarUrl,
            });

            setUser(updatedUser.user);
            updateState('editing', false);
        } catch (err) {
            const status =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: Response }).response?.status
                    : undefined;

            if (status === 409) {
                updateState('errorMessage', 'User with this username already exists.');
                setTimeout(() => updateState('errorMessage', ''), 2000);
                return;
            }

            updateState('errorMessage', await getApiErrorMessage(err));
        } finally {
            setTimeout(() => updateState('cooldown', false), 1000);
        }
    };

    if (isFetching) return <Loader />;

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorTextPlaceholder: 'var(--soft-text)',
                },
            }}
        >
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
                                        disabled ||
                                        (state.fullName === user.fullName &&
                                            state.username === user.username &&
                                            state.description === user.description &&
                                            state.avatarUrl === user.avatarUrl &&
                                            state.bannerUrl === user.bannerUrl)
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
                                        status={state.fullName === '' ? 'error' : 'validating'}
                                        onChange={(e) => updateState('fullName', e.target.value)}
                                        placeholder="Full Name"
                                        maxLength={FULLNAME_MAX_LENGTH}
                                        style={{
                                            bottom: 10,
                                            marginBottom: '6px',
                                            backgroundColor: 'var(--container-color)',
                                            color: 'var(--text-color)',
                                        }}
                                        showCount
                                    />
                                    <Input
                                        value={state.username}
                                        onChange={(e) => updateState('username', e.target.value)}
                                        status={state.username === '' ? 'error' : 'validating'}
                                        placeholder="@username"
                                        maxLength={USERNAME_MAX_LENGTH}
                                        minLength={USERNAME_MIN_LENGTH}
                                        style={{
                                            bottom: 10,
                                            marginBottom: '6px',
                                            backgroundColor: 'var(--container-color)',
                                            color: 'var(--text-color)',
                                        }}
                                        showCount
                                    />
                                    <Input.TextArea
                                        value={state.description}
                                        onChange={(e) => updateState('description', e.target.value)}
                                        placeholder="Description"
                                        autoSize={{ minRows: 2, maxRows: 4 }}
                                        maxLength={DESCRPITION_MAX_LENGTH}
                                        style={{
                                            bottom: 10,
                                            marginBottom: '6px',
                                            backgroundColor: 'var(--container-color)',
                                            color: 'var(--text-color)',
                                        }}
                                        showCount
                                    />
                                </>
                            ) : (
                                <>
                                    <h1 className={styles.name}>
                                        {user.fullName}
                                        {user.roles.map((x) => (
                                            <span style={{ marginLeft: 8 }} key={x}>
                                                <UserBadge role={x} />
                                            </span>
                                        ))}
                                    </h1>

                                    <span onClick={handleCopy} className={styles.username}>
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
                                        {user.description.length > 0
                                            ? user.description
                                            : 'No bio yet'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <div className={styles['follow-stats']}>
                    <div className={styles['follow-stat']}>
                        <span className={styles['follow-number']}>{user.subscriptions}</span>
                        <span className={styles['follow-label']}>Following</span>
                    </div>

                    <div className={styles['follow-divider']} />

                    <div className={styles['follow-stat']}>
                        <span className={styles['follow-number']}>{user.followers}</span>
                        <span className={styles['follow-label']}>Followers</span>
                    </div>
                </div>

                <div className={styles['collections-category']}>
                    <Button
                        variant={state.tab === 'authorTab' ? 'contained' : 'outlined'}
                        onClick={() => handleTabChoice('authorTab')}
                        sx={{
                            borderRadius: 10,
                            textTransform: 'none',
                        }}
                    >
                        <AutoAwesomeMosaicIcon sx={{ width: 18, height: 18 }} />
                        <span className={styles['category-text']}>Created</span>
                    </Button>

                    <Button
                        variant={state.tab === 'favoritesTab' ? 'contained' : 'outlined'}
                        onClick={() => handleTabChoice('favoritesTab')}
                        sx={{ borderRadius: 10, textTransform: 'none' }}
                    >
                        <BookmarksIcon
                            sx={{
                                width: 18,
                                height: 18,
                            }}
                        />
                        <span className={styles['category-text']}>Favorites</span>
                    </Button>

                    <Button
                        variant={state.tab === 'privateTab' ? 'contained' : 'outlined'}
                        onClick={() => handleTabChoice('privateTab')}
                        sx={{ borderRadius: 10, textTransform: 'none' }}
                    >
                        <LockIcon
                            sx={{
                                width: 18,
                                height: 18,
                            }}
                        />
                        <span className={styles['category-text']}>Private</span>
                    </Button>

                    {state.tab !== 'privateTab' && (
                        <SortBy
                            className={styles['collections-search']}
                            disabled={collections.length === 0}
                        />
                    )}
                </div>

                <div className={styles['before-collections-line']} />

                <div className={styles['collections-wrapper']}>
                    <CollectionsWrapper collections={collections} page="profile" />
                </div>
            </header>
        </ConfigProvider>
    );
}
