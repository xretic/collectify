'use client';

import { useUser } from '@/context/UserProvider';
import { useUIStore } from '@/stores/uiStore';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { Avatar } from '@mui/material';
import { Button, ConfigProvider } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import styles from '../collections.module.css';
import { ItemCard } from '@/components/ItemCard/ItemCard';
import { arrayMove, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableItemCard } from '@/components/SortableItemCard/SortableItemCard';
import { useDebounce } from '@/lib/useDebounce';

export default function CollectionPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { user, loading } = useUser();
    const { startLoading, stopLoading } = useUIStore();
    const router = useRouter();
    const [collection, setCollection] = useState<CollectionPropsAdditional | null>(null);
    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<{ id: number; order: number }[] | null>(null);
    const debouncedOrder = useDebounce(pendingOrder, 800);

    const loadCollectionData = async (action?: 'like' | 'dislike' | 'favorite' | 'unfavorite') => {
        startLoading();

        const url = action
            ? `/api/collections/${id}/action?actionType=${action}`
            : `/api/collections/${id}/action`;

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

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const isOwner = user && collection && user.id === collection.authorId;

    const handleDragEnd = ({ active, over }: any) => {
        if (!over || active.id === over.id) return;

        setCollection((prev) => {
            if (!prev) return prev;

            const oldIndex = prev.items.findIndex((it) => it.id === active.id);
            const newIndex = prev.items.findIndex((it) => it.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return prev;

            const moved = arrayMove(prev.items, oldIndex, newIndex);
            const next = moved.map((it, idx) => ({ ...it, order: idx }));

            const nextPayload = next.map((it) => ({ id: it.id, order: it.order }));
            setPendingOrder(nextPayload);

            return { ...prev, items: next };
        });
    };

    useEffect(() => {
        if (!debouncedOrder) return;
        if (!collection) return;

        if (!isOwner) return;

        const save = async () => {
            await fetch(`/api/collections/${id}/order`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ items: debouncedOrder }),
            });
        };

        save().catch(console.error);
    }, [debouncedOrder, id, collection]);

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
            <div className={styles['container']}>
                <span className={styles['title']}>{collection.name}</span>
                <span className={styles['category']}>{collection.category}</span>
                <Image
                    src={collection?.bannerUrl ?? '/'}
                    alt="Banner"
                    fill
                    priority
                    sizes="100vw"
                    className={styles.banner}
                />

                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black/50 to-transparent pointer-events-none" />

                <Link href={'/users/' + collection.authorId} className={styles['author']}>
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
            <div className={styles['description-container']}>
                <h1 className={styles['header']}>Description</h1>
                <span className={styles['description']}>{collection.description}</span>

                <div className={styles['actions']}>
                    <Button
                        danger
                        onClick={handleLike}
                        disabled={!user}
                        icon={
                            liked ? (
                                <FavoriteIcon sx={{ width: 17, height: 17 }} />
                            ) : (
                                <FavoriteBorderIcon sx={{ width: 17, height: 17 }} />
                            )
                        }
                        style={{ backgroundColor: 'var(--container-color)' }}
                    >
                        {liked ? 'Unlike' : 'Like'}
                    </Button>

                    <ConfigProvider
                        theme={{
                            components: {
                                Button: {
                                    colorPrimaryHover: '#ffc247',
                                    colorPrimaryActive: '#ffc247',
                                },
                            },
                        }}
                    >
                        <Button
                            className={!user ? '' : styles['favorite-button-yellow-outline']}
                            onClick={handleFavorite}
                            disabled={!user}
                            icon={
                                favorited ? (
                                    <BookmarkIcon sx={{ width: 17, height: 17 }} />
                                ) : (
                                    <BookmarkBorderIcon sx={{ width: 17, height: 17 }} />
                                )
                            }
                            style={{ backgroundColor: 'var(--container-color)' }}
                        >
                            {favorited ? 'Remove' : 'Add'}
                        </Button>
                    </ConfigProvider>
                </div>
            </div>

            <div className={styles.itemsGrid}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={collection.items.map((it) => it.id)}
                        strategy={rectSortingStrategy}
                    >
                        {collection.items.map((x) => (
                            <SortableItemCard key={x.id} id={x.id} disabled={!isOwner}>
                                {({ setNodeRef, style, attributes, listeners }) => (
                                    <div ref={setNodeRef} style={style} {...attributes}>
                                        <ItemCard
                                            title={x.title}
                                            description={x.description}
                                            sourceUrl={x.sourceUrl}
                                            imageUrl={x.imageUrl}
                                            draggable={!!isOwner}
                                            dragHandleProps={listeners}
                                        />
                                    </div>
                                )}
                            </SortableItemCard>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </>
    ) : null;
}
