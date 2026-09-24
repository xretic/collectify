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
