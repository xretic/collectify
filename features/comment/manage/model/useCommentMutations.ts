'use client';

import { useMutation } from '@tanstack/react-query';
import { commentApi } from '@/entities/comment/api/commentApi';
import type { CollectionComment } from '@/entities/comment/model/types';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { useCommentCache } from '../../model/useCommentCache';

const showError = async (error: unknown) => toast.error(await getApiErrorMessage(error));

export function useCommentMutations(collectionId: number) {
    const cache = useCommentCache(collectionId);

    const update = useMutation({
        mutationFn: ({ commentId, text }: { commentId: number; text: string }) =>
            commentApi.update(commentId, text),
        onSuccess: (comment) => cache.patch(comment.id, () => comment),
        onError: showError,
    });

    const remove = useMutation({
        mutationFn: (comment: CollectionComment) => commentApi.delete(comment.id),
        onSuccess: (_, comment) => cache.remove(comment),
        onError: showError,
    });

    /** Collection owner's heart, applied optimistically. */
    const heart = useMutation({
        mutationFn: ({ commentId, liked }: { commentId: number; liked: boolean }) =>
            commentApi.setAuthorLike(commentId, liked),
        onMutate: ({ commentId, liked }) =>
            cache.patch(commentId, (comment) => ({ ...comment, likedByAuthor: liked })),
        onError: async (error, { commentId, liked }) => {
            cache.patch(commentId, (comment) => ({ ...comment, likedByAuthor: !liked }));
            await showError(error);
        },
    });

    return { update, remove, heart };
}
