'use client';

import type { ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';
import { formatCompact } from '@/shared/lib/format/number';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';

type EngagementButtonsProps = {
    collection: CollectionDetails;
    disabled: boolean;
    className?: string;
    /** More actions in the same row (e.g. the "Save" menu). */
    children?: ReactNode;
};

/** Like with an optimistic counter, plus any extra actions next to it. */
export function EngagementButtons({
    collection,
    disabled,
    className,
    children,
}: EngagementButtonsProps) {
    const cache = useCollectionCache(collection.id);

    const toggle = useMutation({
        mutationFn: (value: boolean) => collectionApi.setLiked(collection.id, value),
        onMutate: (value) => {
            const previous = cache.snapshot();

            cache.update((current) => ({
                ...current,
                liked: value,
                likes: Math.max(0, current.likes + (value ? 1 : -1)),
            }));

            return { previous };
        },
        onSuccess: () => cache.invalidateLists(),
        onError: async (error, _, context) => {
            cache.restore(context?.previous);
            toast.error(await getApiErrorMessage(error));
        },
    });

    return (
        <div className={`${styles.actions} ${className ?? ''}`}>
            <button
                type="button"
                className={`${styles.toggle} ${collection.liked ? styles.active : ''}`}
                disabled={disabled || toggle.isPending}
                onClick={() => toggle.mutate(!collection.liked)}
                aria-pressed={collection.liked}
                aria-label={collection.liked ? 'Unlike' : 'Like'}
                title={disabled ? 'Sign in to like' : undefined}
            >
                {collection.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                <span className={styles.count}>{formatCompact(collection.likes)}</span>
            </button>

            {children}
        </div>
    );
}
