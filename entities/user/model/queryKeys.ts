export const userQueryKeys = {
    search: (query: string) => ['users', 'search', query] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
    allFollows: () => ['users', 'follows'] as const,
    follows: (userId: number, kind: 'followers' | 'following') =>
        [...userQueryKeys.allFollows(), userId, kind] as const,
    interests: () => ['users', 'me', 'interests'] as const,
    allSuggestions: () => ['users', 'suggestions'] as const,
    suggestions: (take: number) => [...userQueryKeys.allSuggestions(), take] as const,
};
