'use client';

import type { ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { promptSignIn } from '@/features/auth/model/authPromptStore';
import { useResumeIntent } from '@/features/auth/model/useResumeIntent';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';

type EngagementButtonsProps = {
    collection: CollectionDetails;
    /** Guests are asked to sign in; the like happens once they are back. */
    guest: boolean;
    className?: string;
    /** More actions in the same row (e.g. the "Save" menu). */
    children?: ReactNode;
};

/** Like with an optimistic counter, plus any extra actions next to it. */
export function EngagementButtons({
    collection,
    guest,
    className,
    children,
}: EngagementButtonsProps) {
    const t = useTranslations('collection');
    const format = useFormatters();
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

    const intent = { kind: 'like', id: collection.id } as const;
    useResumeIntent(intent, !guest && !collection.liked, () => toggle.mutate(true));

    const onClick = () => {
        if (guest) promptSignIn('like', intent);
        else toggle.mutate(!collection.liked);
    };

    return (
        <div className={`${styles.actions} ${className ?? ''}`}>
            <button
                type="button"
                className={`${styles.toggle} ${collection.liked ? styles.active : ''}`}
                disabled={toggle.isPending}
                onClick={onClick}
                aria-pressed={collection.liked}
                aria-label={collection.liked ? t('unlike') : t('like')}
            >
                {collection.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                <span className={styles.count}>{format.compact(collection.likes)}</span>
            </button>

            {children}
        </div>
    );
}
