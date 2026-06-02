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
import { useUIStore } from '@/shared/model/uiStore';
import { PAGE_SIZE } from '@/lib/constans';
import { usePaginationStore } from '@/shared/model/paginationStore';
import { useCollectionSearchStore } from '@/features/collection/search/model/collectionSearchStore';
import styles from '@/app/users/users.module.css';
import { IconButton, Snackbar, SnackbarCloseReason, Tooltip } from '@mui/material';
import { UserInResponse } from '@/types/UserInResponse';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '@/components/ui/Loader';
import EmailIcon from '@mui/icons-material/Email';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { useFirstMessageDialogStore } from '@/features/chat/create/model/firstMessageDialogStore';
import FirstMessageDialog from '@/components/features/chats/FirstMessageDialog';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { userApi } from '@/entities/user/api/userApi';
import { chatApi } from '@/entities/chat/api/chatApi';
import UserBadge from '@/components/ui/UserBadge';

export default function ProfilePage() {
    const params = useParams<{ id: string }>();
    const id = params?.id ?? '';

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
        enabled: id !== '' && paramsMemo.authorId != null,
        staleTime: 10_000,
        queryFn: () =>
            collectionApi.search({
                sortedBy: paramsMemo.sortedBy,
                skip: paramsMemo.skip,
                authorId: paramsMemo.authorId,
                privateOnly: false,
                query: paramsMemo.query,
                followed: paramsMemo.followed,
            }),
    });

    const collections = data ?? [];

    const toggleFollow = async () => {
        if (!user || !pageUser) return;

        const nextFollowed = !followed;
        const action = nextFollowed ? 'follow' : 'unfollow';

        setFollowed(nextFollowed);
        setPageUser((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                followers: Math.max(0, (prev.followers ?? 0) + (nextFollowed ? 1 : -1)),
                sessionUserIsFollowed: nextFollowed,
            };
        });

        try {
            await userApi.updateFollow(pageUser.id, action);
        } catch {
            setFollowed(!nextFollowed);
            setPageUser((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    followers: Math.max(0, (prev.followers ?? 0) + (nextFollowed ? -1 : 1)),
                    sessionUserIsFollowed: !nextFollowed,
                };
            });
        }
    };

    const toggleMessage = async () => {
        startLoading();

        if (!pageUser) return;

        try {
            const data = await chatApi.getExistence(pageUser.id);

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
            if (!id) return;

            try {
                const loadedUser = await userApi.getById(id);

                setFollowed(loadedUser.sessionUserIsFollowed);
                setPageUser(loadedUser);
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
                                color="inherit"
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
                                <h1 className={styles['name']}>
                                    {pageUser.fullName}
                                    {pageUser.roles.map((x) => (
                                        <span style={{ marginLeft: 8 }} key={x}>
                                            <UserBadge role={x} />
                                        </span>
                                    ))}
                                </h1>
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

                <div className={styles['follow-stats']}>
                    <div className={styles['follow-stat']}>
                        <span className={styles['follow-number']}>{pageUser.subscriptions}</span>
                        <span className={styles['follow-label']}>Following</span>
                    </div>

                    <div className={styles['follow-divider']} />

                    <div className={styles['follow-stat']}>
                        <span className={styles['follow-number']}>{pageUser.followers}</span>
                        <span className={styles['follow-label']}>Followers</span>
                    </div>
                </div>

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
