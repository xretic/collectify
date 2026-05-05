export const chatQueryKeys = {
    list: (skip: number) => ['chats', { skip }] as const,
    detail: (chatId: string | number, cursor?: number | null) =>
        ['chat', String(chatId), { cursor: cursor ?? null }] as const,
    existence: (userId: string | number) => ['chat-existence', String(userId)] as const,
};
