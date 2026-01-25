'use client';

import { useUser } from '@/context/UserProvider';
import { useUIStore } from '@/stores/uiStore';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { Alert, Avatar } from '@mui/material';
import { Button, ConfigProvider } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';

export default function CollectionPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { user, loading } = useUser();
    const { startLoading, stopLoading } = useUIStore();
    const router = useRouter();
    const [collection, setCollection] = useState<CollectionPropsAdditional | null>(null);
    const [unAuthorizedError, setUnAuthorized] = useState(false);
    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);

    const loadCollectionData = async (action?: 'like' | 'dislike' | 'favorite' | 'unfavorite') => {
        startLoading();

        const url = action
            ? `/api/collections/${id}?actionType=${action}`
            : `/api/collections/${id}`;

        const response = await fetch(url, {
            method: action ? 'PATCH' : 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        if (response.status === 200) {
            const data = await response.json();
            setCollection(data.data);
        } else {
            router.replace('/');
        }

        stopLoading();
    };

    const handleUnauthorized = () => {
        setUnAuthorized(true);
        setTimeout(() => setUnAuthorized(false), 2000);
    };

    const handleLike = async () => {
        const nextAction = liked ? 'dislike' : 'like';

        setLiked(!liked);

        try {
            await loadCollectionData(nextAction);
        } catch {
            setLiked(liked);
        }
    };

    const handleFavorite = async () => {
        const nextAction = favorited ? 'unfavorite' : 'favorite';

        setFavorited(!favorited);

        try {
            await loadCollectionData(nextAction);
        } catch {
            setFavorited(favorited);
        }
    };

    useEffect(() => {
        loadCollectionData();
    }, [id]);

    useEffect(() => {
        if (loading) return;
        if (!user || !collection) return;

        setLiked(collection.likes.some((x) => x.id === user.id));
        setFavorited(collection.addedToFavorite.some((x) => x.id === user.id));
    }, [loading, user, collection]);

    if (loading) return null;

    return collection ? (
        <>
            {unAuthorizedError && (
                <div className={`toast ${unAuthorizedError ? 'show' : ''}`}>
                    <Alert severity="warning" variant="filled">
                        You must be authorized to do this.
                    </Alert>
                </div>
            )}

            <div className="collection-page-title-container">
                <span className="collection-page-title">{collection.name}</span>
                <span className="collection-page-category">{collection.category}</span>
                <Image
                    src={collection?.bannerUrl ?? '/'}
                    alt="Banner"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black/50 to-transparent pointer-events-none"></div>
                <Link href={'/users/' + collection.authorId} className="collection-page-author">
                    <Avatar
                        alt={collection.author}
                        src={collection.authorAvatarUrl}
                        sx={{ width: 30, height: 30 }}
                    >
                        {collection.author}
                    </Avatar>
                    <span>{collection.author}</span>
                </Link>

                <div>{collection.items.length}</div>
            </div>
            <div className="collection-page-description-container">
                <h1 className="collection-page-header">Description</h1>
                <span className="collection-page-description">{collection.description}</span>

                <div className="collection-page-actions">
                    <Button
                        danger
                        onClick={user ? handleLike : handleUnauthorized}
                        icon={
                            liked ? (
                                <FavoriteIcon sx={{ width: 17, height: 17 }} />
                            ) : (
                                <FavoriteBorderIcon sx={{ width: 17, height: 17 }} />
                            )
                        }
                    >
                        {liked ? 'Unlike' : 'Like'}
                    </Button>

                    <ConfigProvider
                        theme={{
                            components: {
                                Button: {
                                    colorBgTextHover: 'rgba(250, 173, 20, 0.10)',
                                    colorPrimaryHover: '#ffc247',
                                },
                            },
                        }}
                    >
                        <Button
                            className="favorite-button-yellow-outline"
                            onClick={user ? handleFavorite : handleUnauthorized}
                            icon={
                                favorited ? (
                                    <BookmarkIcon sx={{ width: 17, height: 17 }} />
                                ) : (
                                    <BookmarkBorderIcon sx={{ width: 17, height: 17 }} />
                                )
                            }
                        >
                            {favorited ? 'Remove' : 'Add'}
                        </Button>
                    </ConfigProvider>
                </div>
            </div>
        </>
    ) : null;
}
