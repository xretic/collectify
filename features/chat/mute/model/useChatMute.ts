'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/shared/model/toastStore';
import { chatApi } from '@/entities/chat/api/chatApi';
import { chatQueryKeys } from '@/entities/chat/model/queryKeys';
import { patchChat, type ChatPages } from '@/entities/chat/model/chatListCache';
import type { MuteDuration } from '@/entities/chat/model/schemas';
import type { ChatMuteState } from '@/entities/chat/model/types';
import { translate } from '@/shared/i18n/translator';

/** Optimistic mute/unmute of one chat in the cached chat list. */
export function useChatMute(chatId: number) {
    const queryClient = useQueryClient();
    const key = chatQueryKeys.lists();

    const setMute = (mute: ChatMuteState | null) =>
        queryClient.setQueryData<ChatPages>(key, (current) =>
            current ? patchChat(current, chatId, (chat) => ({ ...chat, mute })) : current,
        );

    const onError = () => {
        toast.error(translate('chats.mute.failed'));
        void queryClient.invalidateQueries({ queryKey: key });
    };

    const mute = useMutation({
        mutationFn: (duration: MuteDuration) => chatApi.mute(chatId, duration),
        onSuccess: setMute,
        onError,
    });

    const unmute = useMutation({
        mutationFn: () => chatApi.unmute(chatId),
        onMutate: () => setMute(null),
        onError,
    });

    return { mute: mute.mutate, unmute: unmute.mutate };
}
