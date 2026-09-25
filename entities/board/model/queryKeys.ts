export const boardQueryKeys = {
    all: ['boards'] as const,
    mine: () => [...boardQueryKeys.all, 'mine'] as const,
};
