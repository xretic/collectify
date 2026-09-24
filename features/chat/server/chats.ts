import 'server-only';
import { db, isUniqueViolation } from '@/shared/server/db';
import { forbidden, notFound } from '@/shared/server/http';
import { CHATS_PAGE_SIZE, MESSAGES_PAGE_SIZE } from '@/shared/lib/constants';
import { assertNotMuted } from '@/entities/sanction/server/sanctions';
import {
    getChatForParticipant,
    messageSelect,
    pairKey,
    toChatMessage,
} from '@/entities/chat/server/queries';
import { publishToUsers } from '@/entities/chat/server/realtime';
import type { ChatMessagesPage, ChatsPage } from '@/entities/chat/model/types';

export async function listChats(userId: number, skip: number): Promise<ChatsPage> {
    // Only chats where the other participant still exists.
    const where = {
        AND: [{ users: { some: { id: userId } } }, { users: { some: { id: { not: userId } } } }],
    };

    const [chats, total] = await Promise.all([
        db.chat.findMany({
            where,
            orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
            skip,
            take: CHATS_PAGE_SIZE,
            select: {
                id: true,
                lastMessageAt: true,
                users: {
                    where: { id: { not: userId } },
                    select: { id: true, username: true, avatarUrl: true },
                },
                messages: {
                    orderBy: { id: 'desc' },
                    take: 1,
                    select: { content: true, createdAt: true },
                },
            },
        }),
        db.chat.count({ where }),
    ]);

    const unread = await db.message.groupBy({
        by: ['chatId'],
        where: {
            chatId: { in: chats.map((chat) => chat.id) },
            recipientUserId: userId,
            read: false,
        },
        _count: { _all: true },
    });
    const unreadByChat = new Map(unread.map((row) => [row.chatId, row._count._all]));

    return {
        total,
        data: chats.map((chat) => ({
            id: chat.id,
            user: chat.users[0] ?? null,
            lastMessage: chat.messages[0]
                ? {
                      content: chat.messages[0].content,
                      createdAt: chat.messages[0].createdAt.toISOString(),
                  }
                : null,
            lastMessageAt: chat.lastMessageAt.toISOString(),
            unread: unreadByChat.get(chat.id) ?? 0,
        })),
    };
}

export async function getChatMessages(
    chatId: number,
    viewerId: number,
    cursor: number | null,
): Promise<ChatMessagesPage> {
    const chat = await getChatForParticipant(chatId, viewerId);

    const rows = await db.message.findMany({
        where: { chatId, ...(cursor ? { id: { lt: cursor } } : {}) },
        orderBy: { id: 'desc' },
        take: MESSAGES_PAGE_SIZE + 1,
        select: messageSelect,
    });

    const page = rows.slice(0, MESSAGES_PAGE_SIZE);

    return {
        chat: { id: chat.id, user: chat.otherUser },
        messages: page.reverse().map(toChatMessage),
        nextCursor: rows.length > MESSAGES_PAGE_SIZE ? page[0].id : null,
    };
}

export async function findChatWith(viewerId: number, userId: number) {
    const chat = await db.chat.findUnique({
        where: { pairKey: pairKey(viewerId, userId) },
        select: { id: true },
    });

    return chat?.id ?? null;
}

async function persistMessage(
    chatId: number,
    senderId: number,
    recipientId: number,
    content: string,
) {
    const [message] = await db.$transaction([
        db.message.create({
            data: { chatId, userId: senderId, recipientUserId: recipientId, content },
            select: messageSelect,
        }),
        db.chat.update({ where: { id: chatId }, data: { lastMessageAt: new Date() } }),
    ]);

    const payload = toChatMessage(message);
    await publishToUsers([senderId, recipientId], 'message:new', payload);

    return payload;
}

export async function sendMessage(chatId: number, senderId: number, content: string) {
    await assertNotMuted(senderId, 'MESSENGER');

    const chat = await getChatForParticipant(chatId, senderId);
    if (!chat.otherUser) throw forbidden('This user has deleted their account.');

    return persistMessage(chat.id, senderId, chat.otherUser.id, content);
}

/** Opens (or reuses) the direct chat with `recipientId` and sends the first message. */
export async function startChat(senderId: number, recipientId: number, content: string) {
    if (senderId === recipientId) throw forbidden('You cannot message yourself.');

    await assertNotMuted(senderId, 'MESSENGER');

    const recipient = await db.user.findUnique({
        where: { id: recipientId },
        select: { id: true },
    });
    if (!recipient) throw notFound('User not found.');

    const key = pairKey(senderId, recipientId);
    let chatId = (await db.chat.findUnique({ where: { pairKey: key }, select: { id: true } }))?.id;

    if (!chatId) {
        try {
            const chat = await db.chat.create({
                data: { pairKey: key, users: { connect: [{ id: senderId }, { id: recipientId }] } },
                select: { id: true },
            });
            chatId = chat.id;
        } catch (error) {
            if (!isUniqueViolation(error)) throw error;
            chatId = (
                await db.chat.findUniqueOrThrow({ where: { pairKey: key }, select: { id: true } })
            ).id;
        }
    }

    const message = await persistMessage(chatId, senderId, recipientId, content);

    return { chatId, message };
}

export async function markChatRead(chatId: number, viewerId: number) {
    await getChatForParticipant(chatId, viewerId);

    await db.message.updateMany({
        where: { chatId, recipientUserId: viewerId, read: false },
        data: { read: true },
    });
}
