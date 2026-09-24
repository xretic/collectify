export const userQueryKeys = {
    search: (query: string) => ['users', 'search', query] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
};
