'use client';

import { useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { commentQueryKeys } from '@/entities/comment/model/queryKeys';
import type { CollectionComment, CommentsPage, RepliesPage } from '@/entities/comment/model/types';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';

type AnyPages = InfiniteData<CommentsPage | RepliesPage>;
type RootPages = InfiniteData<CommentsPage>;

/**
 * Local updates of every cached comment list of a collection (top-level list
 * and loaded reply threads) plus the collection's comment counter.
 */
export function useCommentCache(collectionId: number) {
    const queryClient = useQueryClient();
    const collectionCache = useCollectionCache(collectionId);
    const rootKey = commentQueryKeys.byCollection(collectionId);

    const mapAll = useCallback(
        (transform: (comments: CollectionComment[]) => CollectionComment[]) =>
            queryClient.setQueriesData<AnyPages>(
                { queryKey: rootKey },
                (data) =>
                    data && {
                        ...data,
                        pages: data.pages.map((page) => ({ ...page, data: transform(page.data) })),
                    },
            ),
        [queryClient, rootKey],
    );

    const changeTotal = useCallback(
        (delta: number) => {
            queryClient.setQueryData<RootPages>(
                rootKey,
                (data) =>
                    data && {
                        ...data,
                        pages: data.pages.map((page) => ({
                            ...page,
                            total: Math.max(0, page.total + delta),
                        })),
                    },
            );
            collectionCache.update((collection) => ({
                ...collection,
                comments: Math.max(0, collection.comments + delta),
            }));
            collectionCache.invalidateLists();
        },
        [collectionCache, queryClient, rootKey],
    );

    const patch = useCallback(
        (commentId: number, update: (comment: CollectionComment) => CollectionComment) =>
            mapAll((comments) =>
                comments.map((comment) => (comment.id === commentId ? update(comment) : comment)),
            ),
        [mapAll],
    );

    const add = useCallback(
        (comment: CollectionComment) => {
            if (comment.parentId === null) {
                queryClient.setQueryData<RootPages>(
                    rootKey,
                    (data) =>
                        data && {
                            ...data,
                            pages: data.pages.map((page, index) =>
                                index === 0 ? { ...page, data: [comment, ...page.data] } : page,
                            ),
                        },
                );
            } else {
                patch(comment.parentId, (parent) => ({ ...parent, replies: parent.replies + 1 }));

                // Append to the thread only when its end is loaded (otherwise paging brings it).
                queryClient.setQueryData<InfiniteData<RepliesPage>>(
                    commentQueryKeys.replies(collectionId, comment.parentId),
                    (data) => {
                        const last = data?.pages.at(-1);
                        if (!data || !last || last.nextCursor !== null) return data;

                        return {
                            ...data,
                            pages: [
                                ...data.pages.slice(0, -1),
                                { ...last, data: [...last.data, comment] },
                            ],
                        };
                    },
                );
            }

            changeTotal(1);
        },
        [changeTotal, collectionId, patch, queryClient, rootKey],
    );

    const remove = useCallback(
        (comment: CollectionComment) => {
            mapAll((comments) => comments.filter((current) => current.id !== comment.id));

            if (comment.parentId !== null) {
                patch(comment.parentId, (parent) => ({
                    ...parent,
                    replies: Math.max(0, parent.replies - 1),
                }));
            }

            // Deleting a thread root deletes its replies too.
            changeTotal(-(1 + (comment.parentId === null ? comment.replies : 0)));
        },
        [changeTotal, mapAll, patch],
    );

    return { patch, add, remove };
}
