export const chatQueryKeys = {
    all: ['chats'] as const,
    lists: () => [...chatQueryKeys.all, 'list'] as const,
    presence: () => [...chatQueryKeys.all, 'presence'] as const,
    with: (userId: number) => [...chatQueryKeys.all, 'with', userId] as const,
    messages: (chatId: number) => [...chatQueryKeys.all, 'messages', chatId] as const,
};
