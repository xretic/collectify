'use client';

import { useUser } from '@/context/UserProvider';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Input } from 'antd';
import { use, useEffect, useState } from 'react';
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

export default function ProfilePage() {
    const { user, loading, setUser } = useUser();
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [username, setUserName] = useState('');
    const [description, setDescription] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [collections, setCollections] = useState<any[]>([]);
    const [tab, setTab] = useState('');
    const { startLoading, stopLoading, sortedBy } = useUIStore();
    const { profilePagination } = usePaginationStore();

    const debouncedPagination = useDebounce(profilePagination, 300);
    const debouncedSortedBy = useDebounce(sortedBy, 300);

    useEffect(() => {
        if (loading) return;

        loadCollections();
    }, [loading, tab, debouncedPagination, debouncedSortedBy]);

    if (!user) return;

    const authorTab = `&authorId=${user.id}`;
    const favoritesTab = `&favoritesUserId=${user.id}`;

    const handleTabChoice = (choice: 'authorTab' | 'favoritesTab') => {
        setTab(choice === 'authorTab' ? authorTab : favoritesTab);
    };

    const loadCollections = async () => {
        startLoading();

        if (tab === '') {
            setTab(authorTab);
        }

        const response = await fetch(
            `/api/collections/search/?skip=${profilePagination * PAGE_SIZE}&sortedBy=${sortedBy}` +
                tab,
        );

        if (response.status === 200) {
            const data = await response.json();

            setCollections(data.data);
        }

        stopLoading();
    };

    const handleEdit = () => {
        setFullName(user.fullName);
        setDescription(user.description);
        setBannerUrl(user.bannerUrl);
        setAvatarUrl(user.avatarUrl);
        setUserName(user.username);
        setEditing(true);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(user.username);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const waitForUploadcare = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;

            const interval = setInterval(() => {
                if ((window as any).uploadcare) {
                    clearInterval(interval);
                    resolve((window as any).uploadcare);
                } else if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('Uploadcare failed to load.'));
                }
            }, 10);
        });
    };

    const handleUpload = async (setUrl: (url: string) => void) => {
        try {
            const uploadcare = await waitForUploadcare();

            uploadcare
                .openDialog(null, {
                    imagesOnly: true,
                    multiple: false,
                    crop: 'free',
                })
                .done((file: any) => {
                    file.done((info: any) => {
                        setUrl(info.cdnUrl);
                    });
                });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        const res = await fetch('/api/users/' + user.id, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullName,
                description,
                username,
                bannerUrl,
                avatarUrl,
            }),
        });

        if (res.status === 409) {
            setErrorMessage('User with this username already exists.');
            setTimeout(() => setErrorMessage(''), 2000);
            return;
        }

        if (!res.ok) return;

        const updatedUser = await res.json();

        setUser(updatedUser.user);
        setEditing(false);
    };

    const handleCancel = () => {
        setEditing(false);
    };

    return (
        <header className="profile">
            {copied && (
                <div className={`toast ${copied ? 'show' : ''}`}>
                    <Alert severity="success" variant="filled">
                        Copied.
                    </Alert>
                </div>
            )}
            {errorMessage.length > 0 && (
                <div className={`toast ${errorMessage.length > 0 ? 'show' : ''}`}>
                    <Alert severity="error" variant="filled">
                        {errorMessage}
                    </Alert>
                </div>
            )}
            <div
                onClick={editing ? () => handleUpload(setBannerUrl) : () => {}}
                className={editing ? 'profile-cover-editing' : 'profile-cover'}
                style={{ backgroundImage: `url(${editing ? bannerUrl : user.bannerUrl})` }}
            />
            <nav className="profile-nav-bar">
                {!editing && (
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

                {editing && (
                    <div className="profile-editing-buttons">
                        <Tooltip title="Accept">
                            <IconButton
                                onClick={handleSave}
                                type="button"
                                sx={{ p: '6px' }}
                                aria-label="Accept"
                                className="confim-btn"
                                disabled={
                                    !fullName.trim() ||
                                    !username.trim() ||
                                    !isUsernameValid(username) ||
                                    fullName.length > FULLNAME_MAX_LENGTH ||
                                    description.length > DESCRPITION_MAX_LENGTH
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
                        className={editing ? 'profile-avatar-editing' : 'profile-avatar'}
                        src={editing ? avatarUrl : user.avatarUrl}
                        alt={user.username}
                        onClick={editing ? () => handleUpload(setAvatarUrl) : () => {}}
                    />
                    <div className="profile-info">
                        {editing ? (
                            <>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Full Name"
                                    style={{ bottom: 10, marginBottom: '6px' }}
                                />
                                <Input
                                    value={username}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="@username"
                                    style={{ bottom: 10, marginBottom: '6px' }}
                                />
                                <Input.TextArea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
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
                    variant={tab === authorTab ? 'contained' : 'outlined'}
                    onClick={() => handleTabChoice('authorTab')}
                    sx={{ borderRadius: 10 }}
                >
                    <AutoAwesomeMosaicIcon sx={{ width: 18, height: 18 }} />
                    <span className="ml-1">Created</span>
                </Button>

                <Button
                    variant={tab === favoritesTab ? 'contained' : 'outlined'}
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
