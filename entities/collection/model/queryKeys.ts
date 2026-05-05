export const collectionQueryKeys = {
    detail: (id: string | number) => ['collection', String(id)] as const,
    comments: (id: string | number) => ['collection-comments', String(id)] as const,
    stats: (id: string | number) => ['collection-stats', String(id)] as const,
    search: ['collections-search'] as const,
    mySearch: ['my-collections-search'] as const,
    meSearch: ['me-collections-search'] as const,
};
