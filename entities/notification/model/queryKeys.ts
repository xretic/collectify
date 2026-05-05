export const notificationQueryKeys = {
    list: (onlyUnread: boolean) => ['notifications', { onlyUnread }] as const,
};
