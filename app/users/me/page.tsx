'use client';

import { useUser } from '@/context/UserProvider';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Input } from 'antd';
import { useEffect, useState } from 'react';
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
import CollectionsWrapper from '@/components/CollectionsWrapper';
import SortBy from '@/components/SortBy';
import { IconButton, Tooltip, Button } from '@mui/material';
import { useDebounce } from '@/lib/useDebounce';

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
        setTimeout(() => updateState('copied', false), 2000);
    };

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

        if (res.status === 409) {
            updateState('errorMessage', 'User with this username already exists.');
            setTimeout(() => updateState('errorMessage', ''), 2000);
            return;
        }

        if (!res.ok) return;

        const updatedUser = await res.json();
        setUser(updatedUser.user);
        updateState('editing', false);
    };

    return (
        <header className="profile">
            {state.copied && (
                <div className={`toast ${state.copied ? 'show' : ''}`}>
                    <Alert severity="success" variant="filled">
                        Copied.
                    </Alert>
                </div>
            )}
            {state.errorMessage.length > 0 && (
                <div className={`toast ${state.errorMessage.length > 0 ? 'show' : ''}`}>
                    <Alert severity="error" variant="filled">
                        {state.errorMessage}
                    </Alert>
                </div>
            )}
            <div
                onClick={
                    state.editing
                        ? () => handleUpload((url) => updateState('bannerUrl', url))
                        : undefined
                }
                className={state.editing ? 'profile-cover-editing' : 'profile-cover'}
                style={{
                    backgroundImage: `url(${state.editing ? state.bannerUrl : user.bannerUrl})`,
                }}
            />
            <nav className="profile-nav-bar">
                {!state.editing && (
                    <Tooltip title="Edit">
                        <IconButton
                            onClick={handleEdit}
                            type="button"
                            sx={{ p: '6px' }}
                            aria-label="Edit"
                            className="profile-action-btn"
                        >
                            <EditOutlinedIcon sx={{ color: '#afafaf' }} />
                        </IconButton>
                    </Tooltip>
                )}

                {state.editing && (
                    <div className="profile-editing-buttons">
                        <Tooltip title="Accept">
                            <IconButton
                                onClick={handleSave}
                                type="button"
                                sx={{ p: '6px' }}
                                aria-label="Accept"
                                className="confim-btn"
                                disabled={
                                    !state.fullName.trim() ||
                                    !state.username.trim() ||
                                    !isUsernameValid(state.username) ||
                                    state.fullName.length > FULLNAME_MAX_LENGTH ||
                                    state.description.length > DESCRPITION_MAX_LENGTH
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
                                className="close-btn"
                            >
                                <CloseIcon sx={{ color: '#afafaf' }} />
                            </IconButton>
                        </Tooltip>
                    </div>
                )}

                <div className="profile-header">
                    <Avatar
                        className={state.editing ? 'profile-avatar-editing' : 'profile-avatar'}
                        src={state.editing ? state.avatarUrl : user.avatarUrl}
                        alt={user.username}
                        onClick={
                            state.editing
                                ? () => handleUpload((url) => updateState('avatarUrl', url))
                                : undefined
                        }
                    />
                    <div className="profile-info">
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
                                <h1 className="profile-name">{user.fullName}</h1>
                                <span onClick={handleCopy} className="profile-username">
                                    @{user.username}
                                </span>
                                <p className="profile-description">
                                    <FormatQuoteIcon />
                                    {user.description.length > 0 ? user.description : 'No bio yet'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <div className="profile-collections-category">
                <Button
                    variant={state.tab === authorTab ? 'contained' : 'outlined'}
                    onClick={() => handleTabChoice('authorTab')}
                    sx={{ borderRadius: 10 }}
                >
                    <AutoAwesomeMosaicIcon sx={{ width: 18, height: 18 }} />
                    <span className="ml-1">Created</span>
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
                    <span className="ml-1">Favorites</span>
                </Button>

                <SortBy />
            </div>

            <div className="profile-before-collections-line" />

            <div className="profile-collections-wrapper">
                <CollectionsWrapper collections={collections} page="profile" />
            </div>
        </header>
    );
}

const isUsernameValid = (username: string): boolean => {
    if (username.length > USERNAME_MAX_LENGTH) return false;

    const regex = /^[a-z0-9_.]+$/;
    return regex.test(username);
};
