import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { forbidden, notFound } from '@/shared/server/http';
import type { ChatMessage } from '../model/types';

export const messageSelect = {
    id: true,
    chatId: true,
    content: true,
    createdAt: true,
    user: { select: { id: true, username: true, avatarUrl: true } },
} satisfies Prisma.MessageSelect;

type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;

export function toChatMessage(row: MessageRow): ChatMessage {
    return {
        id: row.id,
        chatId: row.chatId,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
        author: row.user,
    };
}

export const pairKey = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`;

/** Chat the viewer participates in, plus the other participant (if still exists). */
export async function getChatForParticipant(chatId: number, viewerId: number) {
    const chat = await db.chat.findUnique({
        where: { id: chatId },
        select: {
            id: true,
            users: { select: { id: true, username: true, avatarUrl: true } },
        },
    });

    if (!chat) throw notFound('Chat not found.');
    if (!chat.users.some((user) => user.id === viewerId)) throw forbidden();

    return {
        id: chat.id,
        otherUser: chat.users.find((user) => user.id !== viewerId) ?? null,
    };
}

/** Presence is only tracked for this many most recently active chats. */
const PRESENCE_CHATS_LIMIT = 200;

/**
 * The other participants of the user's most recently active direct chats (who
 * see their online status). Bounded so presence fan-out stays cheap for users
 * with a very long chat list.
 */
export async function getChatPartnerIds(userId: number): Promise<number[]> {
    const chats = await db.chat.findMany({
        where: { users: { some: { id: userId } } },
        orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
        take: PRESENCE_CHATS_LIMIT,
        select: { users: { where: { id: { not: userId } }, select: { id: true } } },
    });

    return [...new Set(chats.flatMap((chat) => chat.users.map((user) => user.id)))];
}

/** Mute that is still in effect (not expired), as `{ until }`, otherwise `null`. */
export function activeMute(row: { until: Date | null } | null | undefined, now = new Date()) {
    if (!row || (row.until && row.until <= now)) return null;
    return { until: row.until?.toISOString() ?? null };
}

export async function isChatMuted(userId: number, chatId: number) {
    const row = await db.chatMute.findUnique({
        where: { userId_chatId: { userId, chatId } },
        select: { until: true },
    });

    return activeMute(row) !== null;
}
