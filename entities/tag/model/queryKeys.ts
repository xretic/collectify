export const tagQueryKeys = {
    all: ['tags'] as const,
    detail: (tagId: number) => [...tagQueryKeys.all, 'detail', tagId] as const,
    search: (categoryId: number, query: string) =>
        [...tagQueryKeys.all, 'search', categoryId, query] as const,
};
