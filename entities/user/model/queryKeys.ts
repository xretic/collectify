export const userQueryKeys = {
    search: (query: string) => ['users-search', query] as const,
    detail: (id: string | number) => ['user', String(id)] as const,
};
