'use client';

import { useUser } from '@/context/UserProvider';
import { Avatar, IconButton, SxProps, Theme, Tooltip, Button as MuiButton } from '@mui/material';
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
import { ItemAddDialog } from '@/components/features/items/ItemAddDialog';
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
import TextArea from 'antd/es/input/TextArea';
import { COMMENT_MAX_LENGTH } from '@/lib/constans';
import { useUIStore } from '@/stores/uiStore';
import { CollectionComment } from '@/components/features/collections/CollectionComment';

type OrderPayloadItem = { id: number; order: number };
type ActionType = 'like' | 'dislike' | 'favorite' | 'unfavorite';

function applyActionOptimistic(
    prev: CollectionPropsAdditional,
    action: ActionType,
): CollectionPropsAdditional {
    const next: any = { ...prev };

    if (action === 'like') next.liked = true;
    if (action === 'dislike') next.liked = false;
    if (action === 'favorite') next.favorited = true;
    if (action === 'unfavorite') next.favorited = false;

    if (typeof next.likesCount === 'number') {
        const delta = action === 'like' ? 1 : action === 'dislike' ? -1 : 0;
        next.likesCount = Math.max(0, next.likesCount + delta);
    }

    if (typeof next.favoritesCount === 'number') {
        const delta = action === 'favorite' ? 1 : action === 'unfavorite' ? -1 : 0;
        next.favoritesCount = Math.max(0, next.favoritesCount + delta);
    }

    return next as CollectionPropsAdditional;
}

export default function CollectionPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const router = useRouter();
    const queryClient = useQueryClient();

    const { user, loading } = useUser();
    const { collection, setCollection } = useCollectionStore();

    const [pendingOrder, setPendingOrder] = useState<OrderPayloadItem[] | null>(null);
    const debouncedOrder = useDebounce(pendingOrder, 800);

    const { setOpen } = useDialogStore();
    const { setOpenDialog } = useDeleteDialogStore();
    const { setOpenEditing } = useEditingDialogStore();
    const { startLoading, stopLoading, loadingCount } = useUIStore();

    const [commentText, setCommentText] = useState('');
    const [commentsSkip, setCommentsSkip] = useState(0); // TODO: make a skip setting while scrolling

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const buttonsStyle: SxProps<Theme> = {
        borderRadius: 6,
        textTransform: 'none',
        color: 'var(--text-color)',
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 2,
        margin: 0,
    };

    const inputStyle: Record<string, string> = {
        backgroundColor: 'var(--container-color)',
        color: 'var(--text-color)',
        borderColor: 'var(--border-color)',
    };

    const collectionKey = useMemo(() => ['collection', String(id)] as const, [id]);

    const { data: collectionData, isError: isCollectionError } =
        useQuery<CollectionPropsAdditional>({
            queryKey: collectionKey,
            enabled: !!id,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            queryFn: async () => {
                const res = await api
                    .get(`api/collections/${id}/action`, { searchParams: { commentsSkip } })
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
                    searchParams: { actionType: action, commentsSkip },
                })
                .json<{ data: CollectionPropsAdditional }>();
            return res.data;
        },
        onMutate: async (action) => {
            await queryClient.cancelQueries({ queryKey: collectionKey });

            const prev = queryClient.getQueryData<CollectionPropsAdditional>(collectionKey);
            if (prev) {
                const optimistic = applyActionOptimistic(prev, action);
                queryClient.setQueryData(collectionKey, optimistic);
                setCollection(optimistic);
            }

            return { prev };
        },
        onError: (_err, _action, ctx) => {
            if (ctx?.prev) {
                queryClient.setQueryData(collectionKey, ctx.prev);
                setCollection(ctx.prev);
            }
        },
        onSuccess: (server) => {
            queryClient.setQueryData(collectionKey, server);
            setCollection(server);
            queryClient.invalidateQueries({ queryKey: ['collections-search'] });
        },
    });

    const commentMutation = useMutation({
        mutationFn: async (payload: { text: string }) => {
            const res = await api
                .post(`api/collections/${id}/comment`, {
                    json: { text: payload.text },
                    searchParams: { commentsSkip },
                })
                .json<{ data: CollectionPropsAdditional }>();
            return res.data;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: collectionKey });
            const prev = queryClient.getQueryData<CollectionPropsAdditional>(collectionKey);
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) {
                queryClient.setQueryData(collectionKey, ctx.prev);
                setCollection(ctx.prev);
            }
        },
        onSuccess: (server) => {
            queryClient.setQueryData(collectionKey, server);
            setCollection(server);
            queryClient.invalidateQueries({ queryKey: ['collections-search'] });
        },
    });

    const orderMutation = useMutation({
        mutationFn: async (items: OrderPayloadItem[]) => {
            await api.patch(`api/collections/${id}/order`, { json: { items } });
            return true;
        },
    });

    const isOwner = !!(user && collection && user.id === collection.authorId);

    const liked = !!collection?.liked;
    const favorited = !!collection?.favorited;

    const handleLike = () => {
        if (!user || !id) return;
        actionMutation.mutate(liked ? 'dislike' : 'like');
    };

    const handleFavorite = () => {
        if (!user || !id) return;
        actionMutation.mutate(favorited ? 'unfavorite' : 'favorite');
    };

    const handleSendComment = async () => {
        if (!id) return;
        if (!commentText.trim()) return;

        startLoading();

        try {
            await commentMutation.mutateAsync({ text: commentText });
            setCommentText('');
        } finally {
            stopLoading();
        }
    };

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

    const lastSentRef = useRef<string>('');

    useEffect(() => {
        if (!debouncedOrder) return;
        if (!isOwner) return;
        if (!id) return;

        const key = JSON.stringify(debouncedOrder);
        if (key === lastSentRef.current) return;
        lastSentRef.current = key;

        orderMutation.mutate(debouncedOrder, {
            onSuccess: () => setPendingOrder(null),
        });
    }, [debouncedOrder, isOwner, id, orderMutation]);

    if (loading) return null;
    if (!collection) return <Loader />;

    return (
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
                            <Tooltip title="Delete collection">
                                <IconButton onClick={() => setOpenDialog(true)} color="error">
                                    <DeleteOutlineOutlinedIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit collection">
                                <IconButton
                                    onClick={() => setOpenEditing(true)}
                                    sx={{ color: 'var(--text-color)' }}
                                >
                                    <EditOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    )}
                </h1>

                <span className={styles['description']}>{collection.description}</span>

                <div className={styles['actions']}>
                    <Button
                        danger
                        onClick={handleLike}
                        disabled={!user || actionMutation.isPending}
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
                            disabled={!user || actionMutation.isPending}
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

                {isOwner && (
                    <button onClick={() => setOpen(true)} className={styles.addItem}>
                        <AddIcon sx={{ width: 25, height: 25 }} />
                    </button>
                )}
            </div>

            <div className={styles.commentDivider}>
                <p className={styles.commentsAmount}>{collection.comments} comments</p>

                <ConfigProvider
                    theme={{
                        token: {
                            colorTextPlaceholder: 'var(--soft-text)',
                            colorIcon: 'var(--soft-text)',
                        },
                    }}
                >
                    {user && (
                        <div className={styles.commentInput}>
                            <TextArea
                                value={commentText}
                                maxLength={COMMENT_MAX_LENGTH}
                                placeholder="Write your comment"
                                onChange={(e) => setCommentText(e.target.value)}
                                style={{ height: 70, resize: 'none', ...inputStyle }}
                            />

                            <MuiButton
                                variant="contained"
                                onClick={handleSendComment}
                                disabled={loadingCount > 0 || commentMutation.isPending}
                                sx={buttonsStyle}
                            >
                                Send
                            </MuiButton>
                        </div>
                    )}

                    <div className={styles.comments}>
                        {collection.commentsRes.map((x) => (
                            <CollectionComment key={x.id} comment={x} />
                        ))}
                    </div>
                </ConfigProvider>
            </div>

            <ItemAddDialog />
            <CollectionDeleteDialog />
            <CollectionEditingDialog />
        </>
    );
}
