'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import CollectionsWrapper from '@/components/features/collections/CollectionsWrapper';
import SortBy from '@/components/ui/SortBy';
import CollectionSearchBar from '@/components/features/collections/CollectionSearchBar';
import { useDebounce } from '@/lib/useDebounce';
import { useUIStore } from '@/stores/uiStore';
import { PAGE_SIZE } from '@/lib/constans';
import { usePaginationStore } from '@/stores/paginationStore';
import { useCollectionSearchStore } from '@/stores/collectionSearchStore';
import styles from '../users.module.css';
import { IconButton, Snackbar, SnackbarCloseReason, Tooltip } from '@mui/material';
import { UserInResponse } from '@/types/UserInResponse';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '@/components/ui/Loader';
import { CollectionFieldProps } from '@/types/CollectionField';
import EmailIcon from '@mui/icons-material/Email';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { useFirstMessageDialogStore } from '@/stores/dialogs/firstMessageDialogStore';
import FirstMessageDialog from '@/components/features/chats/FirstMessageDialog';

export default function ProfilePage() {
    const params = useParams<{ id: string }>();

    if (!params) return null;

    const id = params.id;

    const { user } = useUser();
    const [pageUser, setPageUser] = useState<UserInResponse | null>(null);
    const [copied, setCopied] = useState(false);
    const [followed, setFollowed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [emptyPage, setEmptyPage] = useState(true);

    const { startLoading, stopLoading, sortedBy } = useUIStore();
    const { setOpen } = useFirstMessageDialogStore();
    const { profilePagination } = usePaginationStore();
    const { query } = useCollectionSearchStore();

    const debouncedQuery = useDebounce(query, 400);
    const debouncedFollowed = useDebounce(followed, 600);

    const router = useRouter();

    const paramsMemo = useMemo(() => {
        const q = (debouncedQuery ?? '').trim();
        const authorId = Number(id);

        return {
            sortedBy: String(sortedBy),
            skip: profilePagination * PAGE_SIZE,
            authorId: Number.isFinite(authorId) ? authorId : null,
            query: q,
            followed: debouncedFollowed,
        };
    }, [sortedBy, profilePagination, debouncedQuery, debouncedFollowed, id]);

    const { data, isFetching } = useQuery({
        queryKey: ['profile-collections-search', paramsMemo],
        enabled: paramsMemo.authorId != null,
        staleTime: 10_000,
        queryFn: async () => {
            const searchParams = new URLSearchParams({
                sortedBy: paramsMemo.sortedBy,
                skip: String(paramsMemo.skip),
                authorId: String(paramsMemo.authorId),
            });

            if (paramsMemo.query) searchParams.set('query', paramsMemo.query);
            if (paramsMemo.followed) searchParams.set('followed', 'true');

            return api
                .get(`api/collections/search/?${searchParams.toString()}`)
                .json<{ data: CollectionFieldProps[] }>();
        },
    });

    const collections = data?.data ?? [];

    const toggleFollow = async () => {
        if (!user || !pageUser) return;

        const action = debouncedFollowed ? 'unfollow' : 'follow';

        try {
            await api.patch('api/users', {
                searchParams: {
                    followUserId: pageUser.id,
                    followAction: action,
                },
            });

            setFollowed(!debouncedFollowed);
        } catch {
            return;
        }
    };

    const toggleMessage = async () => {
        startLoading();

        if (!pageUser) return;

        try {
            const data = await api
                .get('api/chats/' + pageUser.id + '/existence')
                .json<{ chatId: number | undefined; result: boolean }>();

            if (data.result) router.replace('/chats/' + data.chatId);
            else setOpen(true);
        } catch {
            return;
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const data = await api.get('api/users/' + id).json<{ user: UserInResponse }>();

                setFollowed(data.user.sessionUserIsFollowed);
                setPageUser(data.user);
                setEmptyPage(false);
            } catch {
                setEmptyPage(true);
                return;
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [id]);

    useEffect(() => {
        if (user && pageUser && user.id === pageUser.id) {
            router.replace('/users/me');
        }
    }, [user, pageUser, router]);

    if (emptyPage && !loading) {
        notFound();
    }

    if (loading || !pageUser) {
        return null;
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(pageUser.username);
        setCopied(true);
    };

    const handleClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }

        setCopied(false);
    };

    const action = (
        <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

    if (isFetching) return <Loader />;

    return (
        <>
            <header className={styles.profile}>
                <div
                    className={styles.cover}
                    style={{ backgroundImage: `url(${pageUser.bannerUrl})` }}
                />

                <nav className={styles['nav-bar']}>
                    <div className={styles.actions}>
                        <Tooltip title={followed ? 'Unfollow' : 'Follow'}>
                            <IconButton
                                onClick={toggleFollow}
                                size="small"
                                color="error"
                                disabled={!user || debouncedFollowed !== followed}
                            >
                                {followed ? <FavoriteIcon /> : <FavoriteBorderOutlinedIcon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Message">
                            <IconButton color="inherit" onClick={toggleMessage}>
                                <EmailIcon />
                            </IconButton>
                        </Tooltip>
                    </div>

                    <div className={styles.header}>
                        <Avatar
                            className={styles.avatar}
                            src={pageUser.avatarUrl}
                            alt={pageUser.username}
                        />
                        <div className={styles.info}>
                            <>
                                <h1 className={styles['name']}>{pageUser.fullName}</h1>
                                <span onClick={handleCopy} className={styles['username']}>
                                    @{pageUser.username}
                                </span>
                                <Snackbar
                                    open={copied}
                                    autoHideDuration={2000}
                                    onClose={handleClose}
                                    message="Username copied."
                                    action={action}
                                />

                                <p className={styles['description']}>
                                    <FormatQuoteIcon />
                                    {pageUser.description.length === 0
                                        ? 'No bio yet'
                                        : pageUser.description}
                                </p>
                            </>
                        </div>
                    </div>
                </nav>

                <div className={styles['collections-category']}>
                    <CollectionSearchBar
                        disabled={debouncedQuery === '' && collections.length === 0}
                    />
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

            <FirstMessageDialog user={pageUser} />
        </>
    );
}
