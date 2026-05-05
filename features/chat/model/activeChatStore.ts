import { create } from 'zustand';

interface ActiveChatState {
    activeChatId: number | null;
    setActiveChatId: (chatId: number | null) => void;
}

export const useActiveChatStore = create<ActiveChatState>((set) => ({
    activeChatId: null,
    setActiveChatId: (chatId) => set({ activeChatId: chatId }),
}));
