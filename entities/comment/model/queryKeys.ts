export const commentQueryKeys = {
    byCollection: (collectionId: number) => ['comments', collectionId] as const,
};
