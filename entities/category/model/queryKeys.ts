export const categoryQueryKeys = {
    all: ['categories'] as const,
    active: () => [...categoryQueryKeys.all, 'active'] as const,
    managed: () => [...categoryQueryKeys.all, 'managed'] as const,
};
