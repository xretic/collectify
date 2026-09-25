import 'server-only';
import { db } from '@/shared/server/db';
import { publishToUsers } from '@/shared/server/realtime';
import { activeMute, getChatForParticipant } from '@/entities/chat/server/queries';
import type { ChatMuteState } from '@/entities/chat/model/types';
import type { MuteDuration } from '@/entities/chat/model/schemas';

const MINUTE = 60_000;

const DURATION_MS: Record<Exclude<MuteDuration, 'forever'>, number> = {
    '15m': 15 * MINUTE,
    '30m': 30 * MINUTE,
    '1h': 60 * MINUTE,
    '8h': 8 * 60 * MINUTE,
    '1d': 24 * 60 * MINUTE,
    '1w': 7 * 24 * 60 * MINUTE,
};

/** Silences the chat's message notifications for the viewer; other tabs follow. */
export async function muteChat(
    chatId: number,
    userId: number,
    duration: MuteDuration,
): Promise<ChatMuteState> {
    await getChatForParticipant(chatId, userId);

    const until = duration === 'forever' ? null : new Date(Date.now() + DURATION_MS[duration]);
    await db.chatMute.upsert({
        where: { userId_chatId: { userId, chatId } },
        update: { until },
        create: { userId, chatId, until },
    });

    const mute = activeMute({ until })!;
    await publishToUsers([userId], 'chat:muted', { chatId, mute });

    return mute;
}

export async function unmuteChat(chatId: number, userId: number) {
    await getChatForParticipant(chatId, userId);

    await db.chatMute.deleteMany({ where: { userId, chatId } });
    await publishToUsers([userId], 'chat:muted', { chatId, mute: null });
}
