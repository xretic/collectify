export const chatQueryKeys = {
    all: ['chats'] as const,
    list: (skip: number) => [...chatQueryKeys.all, 'list', skip] as const,
    lists: () => [...chatQueryKeys.all, 'list'] as const,
    messages: (chatId: number) => [...chatQueryKeys.all, 'messages', chatId] as const,
};
