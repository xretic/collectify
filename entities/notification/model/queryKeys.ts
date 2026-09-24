export const notificationQueryKeys = {
    all: ['notifications'] as const,
    list: (onlyUnread: boolean) => [...notificationQueryKeys.all, { onlyUnread }] as const,
};
