'use client';

import { useUser } from '@/context/UserProvider';
import { useUIStore } from '@/stores/uiStore';
import { Avatar, IconButton } from '@mui/material';
import { Button, ConfigProvider } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import styles from '../collections.module.css';
import { ItemCard } from '@/components/features/items/ItemCard';
import { arrayMove, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableItemCard } from '@/components/features/items/SortableItemCard';
import { useDebounce } from '@/lib/useDebounce';
import AddIcon from '@mui/icons-material/Add';
import { ItemDialog } from '@/components/features/items/ItemDialog';
import { useDialogStore } from '@/stores/dialogs/dialogStore';
import { useCollectionStore } from '@/stores/collectionStore';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { CollectionDeleteDialog } from '@/components/features/collections/CollectionDeleteDialog';
import { useDeleteDialogStore } from '@/stores/dialogs/deleteDialogStore';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { CollectionEditingDialog } from '@/components/features/collections/CollectionEditingDialog';
import { useEditingDialogStore } from '@/stores/dialogs/editCollectionDialogStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { api } from '@/lib/api';
import { Loader } from '@/components/ui/Loader';

type OrderPayloadItem = { id: number; order: number };
type ActionType = 'like' | 'dislike' | 'favorite' | 'unfavorite';

export default function CollectionPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const router = useRouter();
    const queryClient = useQueryClient();

    const { user, loading } = useUser();

    const { collection, setCollection } = useCollectionStore();

    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);

    const [pendingOrder, setPendingOrder] = useState<OrderPayloadItem[] | null>(null);
    const debouncedOrder = useDebounce(pendingOrder, 800);

    const { setOpen } = useDialogStore();
    const { setOpenDialog } = useDeleteDialogStore();
    const { setOpenEditing } = useEditingDialogStore();

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const collectionKey = useMemo(() => ['collection', String(id)] as const, [id]);

    const { data: collectionData, isError: isCollectionError } =
        useQuery<CollectionPropsAdditional>({
            queryKey: collectionKey,
            enabled: !!id,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            queryFn: async () => {
                const res = await api
                    .get(`api/collections/${id}/action`)
                    .json<{ data: CollectionPropsAdditional }>();

                return res.data;
            },
        });

    useEffect(() => {
        if (collectionData) setCollection(collectionData);
    }, [collectionData, setCollection]);

    useEffect(() => {
        if (!isCollectionError) return;
        router.replace('/');
    }, [isCollectionError, router]);

    const actionMutation = useMutation({
        mutationFn: async (action: ActionType) => {
            const res = await api
                .patch(`api/collections/${id}/action`, {
                    searchParams: { actionType: action },
                })
                .json<{ data: CollectionPropsAdditional }>();

            return res.data;
        },

        onMutate: async (action) => {
            queryClient.removeQueries({
                queryKey: ['collections-search'],
            });

            await queryClient.cancelQueries({ queryKey: collectionKey });

            const previous = queryClient.getQueryData<CollectionPropsAdditional>(collectionKey);

            queryClient.setQueryData<CollectionPropsAdditional>(collectionKey, (old) => {
                if (!old || !user) return old;

                const userId = user.id;

                if (action === 'like') {
                    if (old.likes?.some((x: any) => x.id === userId)) return old;
                    return { ...old, likes: [...(old.likes ?? []), { id: userId }] };
                }

                if (action === 'dislike') {
                    return { ...old, likes: (old.likes ?? []).filter((x: any) => x.id !== userId) };
                }

                if (action === 'favorite') {
                    if (old.addedToFavorite?.some((x: any) => x.id === userId)) return old;
                    return {
                        ...old,
                        addedToFavorite: [...(old.addedToFavorite ?? []), { id: userId }],
                    };
                }

                if (action === 'unfavorite') {
                    return {
                        ...old,
                        addedToFavorite: (old.addedToFavorite ?? []).filter(
                            (x: any) => x.id !== userId,
                        ),
                    };
                }

                return old;
            });

            return { previous };
        },

        onError: (_err, _action, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(collectionKey, ctx.previous);
        },

        onSuccess: (serverCollection) => {
            queryClient.setQueryData(collectionKey, serverCollection);
        },
    });

    const handleLike = () => {
        if (!user) return;

        const nextAction: ActionType = liked ? 'dislike' : 'like';

        setLiked((x) => !x);

        actionMutation.mutate(nextAction, {
            onError: () => setLiked((v) => !v),
        });
    };

    const handleFavorite = () => {
        if (!user) return;

        const nextAction: ActionType = favorited ? 'unfavorite' : 'favorite';
        setFavorited((x) => !x);
        actionMutation.mutate(nextAction, {
            onError: () => setFavorited((v) => !v),
        });
    };

    const isOwner = !!(user && collection && user.id === collection.authorId);

    const handleDragEnd = ({ active, over }: any) => {
        if (!over || active.id === over.id) return;
        if (!isOwner) return;

        setCollection((prev: any) => {
            if (!prev) return prev;

            const oldIndex = prev.items.findIndex((it: any) => it.id === active.id);
            const newIndex = prev.items.findIndex((it: any) => it.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return prev;

            const moved = arrayMove(prev.items, oldIndex, newIndex);
            const nextItems = moved.map((it: any, idx: number) => ({ ...it, order: idx }));

            const payload = nextItems.map((it: any) => ({ id: it.id, order: it.order }));
            setPendingOrder(payload);

            queryClient.setQueryData<CollectionPropsAdditional>(collectionKey, (old) => {
                if (!old) return old;
                return { ...old, items: nextItems };
            });

            return { ...prev, items: nextItems };
        });
    };

    const { mutate: saveOrder } = useMutation({
        mutationFn: async (items: OrderPayloadItem[]) => {
            await api.patch(`api/collections/${id}/order`, {
                json: { items },
            });
        },
    });

    const lastSentRef = useRef<string>('');

    useEffect(() => {
        if (!debouncedOrder) return;
        if (!isOwner) return;

        const key = JSON.stringify(debouncedOrder);
        if (key === lastSentRef.current) return;
        lastSentRef.current = key;

        saveOrder(debouncedOrder, {
            onSuccess: () => {
                setPendingOrder(null);
            },
        });
    }, [debouncedOrder, isOwner, saveOrder]);

    useEffect(() => {
        if (loading) return;
        if (!user) return;
        const src = collectionData ?? collection;
        if (!src) return;

        setLiked(src.likes?.some((x: any) => x.id === user.id) ?? false);
        setFavorited(src.addedToFavorite?.some((x: any) => x.id === user.id) ?? false);
    }, [loading, user, collectionData, collection]);

    if (loading) return null;
    if (!collection) return <Loader />;

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
            </div>
            <div className={styles['description-container']}>
                <h1 className={styles['header']}>
                    <span>Description</span>
                    {user?.id === collection.authorId && (
                        <div>
                            <IconButton onClick={() => setOpenDialog(true)} color="error">
                                <DeleteOutlineOutlinedIcon />
                            </IconButton>

                            <IconButton
                                onClick={() => setOpenEditing(true)}
                                sx={{ color: 'var(--text-color)' }}
                            >
                                <EditOutlinedIcon />
                            </IconButton>
                        </div>
                    )}
                </h1>

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
                                            draggable={!!isOwner}
                                            dragHandleProps={listeners}
                                        />
                                    </div>
                                )}
                            </SortableItemCard>
                        ))}
                    </SortableContext>
                </DndContext>

                {isOwner && (
                    <button onClick={() => setOpen(true)} className={styles.addItem}>
                        <AddIcon sx={{ width: 25, height: 25 }} />
                    </button>
                )}
            </div>

            <ItemDialog />
            <CollectionDeleteDialog />
            <CollectionEditingDialog />
        </>
    ) : null;
}
