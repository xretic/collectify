/** The signed-in user (`null` for guests); seeded on the server by the root layout. */
export const sessionUserQueryKey = ['session-user'] as const;

export const userQueryKeys = {
    detail: (id: number) => ['users', 'detail', id] as const,
    allFollows: () => ['users', 'follows'] as const,
    follows: (userId: number, kind: 'followers' | 'following') =>
        [...userQueryKeys.allFollows(), userId, kind] as const,
    interests: () => ['users', 'me', 'interests'] as const,
    creators: (categoryIds: number[]) => ['users', 'creators', categoryIds] as const,
    allSuggestions: () => ['users', 'suggestions'] as const,
    suggestions: (take: number) => [...userQueryKeys.allSuggestions(), take] as const,
};
