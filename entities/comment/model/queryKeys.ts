export const commentQueryKeys = {
    all: ['comments'] as const,
    byCollection: (collectionId: number) => [...commentQueryKeys.all, collectionId] as const,
    replies: (collectionId: number, commentId: number) =>
        [...commentQueryKeys.byCollection(collectionId), 'replies', commentId] as const,
};
