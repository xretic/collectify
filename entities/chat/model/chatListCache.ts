import type { InfiniteData } from '@tanstack/react-query';
import type { ChatMuteState, ChatPreview, ChatsPage } from './types';

/** Cached pages of the chat list (`chatQueryKeys.lists()`). */
export type ChatPages = InfiniteData<ChatsPage, number>;

/** Applies `update` to the chat everywhere in the pages; `toTop` moves it to the first row. */
export function patchChat(
    data: ChatPages,
    chatId: number,
    update: (chat: ChatPreview) => ChatPreview,
    toTop = false,
): ChatPages {
    const chat = data.pages.flatMap((page) => page.data).find((item) => item.id === chatId);
    if (!chat) return data;

    const updated = update(chat);

    return {
        ...data,
        pages: data.pages.map((page, index) => {
            if (!toTop) {
                return {
                    ...page,
                    data: page.data.map((item) => (item.id === chatId ? updated : item)),
                };
            }

            const rest = page.data.filter((item) => item.id !== chatId);
            return { ...page, data: index === 0 ? [updated, ...rest] : rest };
        }),
    };
}

/** A mute that has not run out yet. */
export function isMuteActive(mute: ChatMuteState | null, now = Date.now()) {
    return mute !== null && (mute.until === null || new Date(mute.until).getTime() > now);
}
