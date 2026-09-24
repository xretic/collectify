'use client';

import { useMutation } from '@tanstack/react-query';
import { Button } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';

type Kind = 'like' | 'favorite';

type EngagementButtonsProps = {
    collection: CollectionDetails;
    disabled: boolean;
};

/** Like / favorite with optimistic counters. */
export function EngagementButtons({ collection, disabled }: EngagementButtonsProps) {
    const cache = useCollectionCache(collection.id);

    const toggle = useMutation({
        mutationFn: ({ kind, value }: { kind: Kind; value: boolean }) =>
            kind === 'like'
                ? collectionApi.setLiked(collection.id, value)
                : collectionApi.setFavorited(collection.id, value),
        onMutate: ({ kind, value }) => {
            const previous = cache.snapshot();
            const delta = value ? 1 : -1;

            cache.update((current) =>
                kind === 'like'
                    ? { ...current, liked: value, likes: Math.max(0, current.likes + delta) }
                    : {
                          ...current,
                          favorited: value,
                          favorites: Math.max(0, current.favorites + delta),
                      },
            );

            return { previous };
        },
        onSuccess: () => cache.invalidateLists(),
        onError: async (error, _, context) => {
            cache.restore(context?.previous);
            toast.error(await getApiErrorMessage(error));
        },
    });

    return (
        <div className={styles.actions}>
            <Button
                variant="outlined"
                color="error"
                className={styles.like}
                disabled={disabled || toggle.isPending}
                startIcon={collection.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={() => toggle.mutate({ kind: 'like', value: !collection.liked })}
                aria-pressed={collection.liked}
            >
                {collection.likes} · {collection.liked ? 'Unlike' : 'Like'}
            </Button>

            <Button
                variant="outlined"
                className={styles.favorite}
                disabled={disabled || toggle.isPending}
                startIcon={collection.favorited ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                onClick={() => toggle.mutate({ kind: 'favorite', value: !collection.favorited })}
                aria-pressed={collection.favorited}
            >
                {collection.favorites} · {collection.favorited ? 'Remove' : 'Add'}
            </Button>
        </div>
    );
}
