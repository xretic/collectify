'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { commentApi } from '@/entities/comment/api/commentApi';
import { commentQueryKeys } from '@/entities/comment/model/queryKeys';
import type { CommentsPage } from '@/entities/comment/model/types';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

export function useCommentMutations(collectionId: number) {
    const queryClient = useQueryClient();
    const collectionCache = useCollectionCache(collectionId);
    const key = commentQueryKeys.byCollection(collectionId);

    const patchPages = (transform: (page: CommentsPage) => CommentsPage) =>
        queryClient.setQueryData<InfiniteData<CommentsPage>>(
            key,
            (data) => data && { ...data, pages: data.pages.map(transform) },
        );

    const showError = async (error: unknown) => toast.error(await getApiErrorMessage(error));

    const update = useMutation({
        mutationFn: ({ commentId, text }: { commentId: number; text: string }) =>
            commentApi.update(commentId, text),
        onSuccess: (comment) =>
            patchPages((page) => ({
                ...page,
                data: page.data.map((current) => (current.id === comment.id ? comment : current)),
            })),
        onError: showError,
    });

    const remove = useMutation({
        mutationFn: (commentId: number) => commentApi.delete(commentId),
        onSuccess: (_, commentId) => {
            patchPages((page) => ({
                ...page,
                total: Math.max(0, page.total - 1),
                data: page.data.filter((comment) => comment.id !== commentId),
            }));
            collectionCache.update((collection) => ({
                ...collection,
                comments: Math.max(0, collection.comments - 1),
            }));
            collectionCache.invalidateLists();
        },
        onError: showError,
    });

    return { update, remove };
}
