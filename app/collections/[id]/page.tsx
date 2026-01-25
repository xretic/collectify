'use client';

import { useUser } from '@/context/UserProvider';
import { useUIStore } from '@/stores/uiStore';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { Avatar } from '@mui/material';
import { Button } from 'antd';
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

    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);

    const loadCollectionData = async () => {
        startLoading();
        const response = await fetch('/api/collections/' + id);

        if (response.status === 200) {
            const data = await response.json();
            setCollection(data.data);
            setLiked(Boolean(user && collection && collection.likes.some((x) => x.id === user.id)));
            setFavorited(
                Boolean(collection && collection.addedToFavorite.some((x) => x.id === user.id)),
            );
        } else {
            router.replace('/');
        }

        stopLoading();
    };

    useEffect(() => {
        loadCollectionData();
    }, [id]);

    if (loading) return null;

    return collection ? (
        <>
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

                    <Button
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
                </div>
            </div>
        </>
    ) : null;
}
