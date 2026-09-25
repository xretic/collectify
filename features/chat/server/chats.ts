import 'server-only';
import { db, isUniqueViolation } from '@/shared/server/db';
import { forbidden, notFound } from '@/shared/server/http';
import { CHATS_PAGE_SIZE, MESSAGES_PAGE_SIZE } from '@/shared/lib/constants';
import { assertNotMuted } from '@/entities/sanction/server/sanctions';
import {
    activeMute,
    getChatForParticipant,
    isChatMuted,
    messageSelect,
    pairKey,
    toChatMessage,
} from '@/entities/chat/server/queries';
import { publishToUsers } from '@/shared/server/realtime';
import { getOnlineUserIds } from '@/shared/server/presence';
import type { ChatMessagesPage, ChatsPage, ChatWith } from '@/entities/chat/model/types';

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
                mutes: { where: { userId }, select: { until: true } },
                users: {
                    where: { id: { not: userId } },
                    select: { id: true, username: true, avatarUrl: true },
                },
                messages: {
                    orderBy: { id: 'desc' },
                    take: 1,
                    select: { content: true, createdAt: true, userId: true },
                },
            },
        }),
        db.chat.count({ where }),
    ]);

    const [unread, online] = await Promise.all([
        db.message.groupBy({
            by: ['chatId'],
            where: {
                chatId: { in: chats.map((chat) => chat.id) },
                recipientUserId: userId,
                read: false,
            },
            _count: { _all: true },
        }),
        getOnlineUserIds(chats.flatMap((chat) => chat.users.map((user) => user.id))),
    ]);
    const unreadByChat = new Map(unread.map((row) => [row.chatId, row._count._all]));

    return {
        total,
        data: chats.map((chat) => ({
            id: chat.id,
            user: chat.users[0] ? { ...chat.users[0], online: online.has(chat.users[0].id) } : null,
            lastMessage: chat.messages[0]
                ? {
                      content: chat.messages[0].content,
                      createdAt: chat.messages[0].createdAt.toISOString(),
                      authorId: chat.messages[0].userId,
                  }
                : null,
            lastMessageAt: chat.lastMessageAt.toISOString(),
            unread: unreadByChat.get(chat.id) ?? 0,
            mute: activeMute(chat.mutes[0]),
        })),
    };
}

export async function getChatMessages(
    chatId: number,
    viewerId: number,
    cursor: number | null,
): Promise<ChatMessagesPage> {
    const chat = await getChatForParticipant(chatId, viewerId);
    const peerId = chat.otherUser?.id;

    const [rows, seen, online] = await Promise.all([
        db.message.findMany({
            where: { chatId, ...(cursor ? { id: { lt: cursor } } : {}) },
            orderBy: { id: 'desc' },
            take: MESSAGES_PAGE_SIZE + 1,
            select: messageSelect,
        }),
        db.message.findFirst({
            where: { chatId, userId: viewerId, readAt: { not: null } },
            orderBy: { id: 'desc' },
            select: { id: true, readAt: true },
        }),
        getOnlineUserIds(peerId ? [peerId] : []),
    ]);

    const page = rows.slice(0, MESSAGES_PAGE_SIZE);

    return {
        chat: {
            id: chat.id,
            user: chat.otherUser && { ...chat.otherUser, online: online.has(chat.otherUser.id) },
            seen: seen?.readAt ? { messageId: seen.id, readAt: seen.readAt.toISOString() } : null,
        },
        messages: page.reverse().map(toChatMessage),
        nextCursor: rows.length > MESSAGES_PAGE_SIZE ? page[0].id : null,
    };
}

/** The existing chat with `userId` (if any) and their preview, for opening a draft chat. */
export async function findChatWith(viewerId: number, userId: number): Promise<ChatWith> {
    if (viewerId === userId) throw forbidden('cannotMessageSelf');

    const [user, chat] = await Promise.all([
        db.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, avatarUrl: true },
        }),
        db.chat.findUnique({ where: { pairKey: pairKey(viewerId, userId) }, select: { id: true } }),
    ]);
    if (!user) throw notFound('userNotFound');

    // Online status is only visible to people the user already chats with.
    const online = chat ? (await getOnlineUserIds([user.id])).has(user.id) : false;

    return { chatId: chat?.id ?? null, user: { ...user, online } };
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
    if (!(await isChatMuted(recipientId, chatId))) {
        await publishToUsers([recipientId], 'message:notify', payload);
    }

    return payload;
}

export async function sendMessage(chatId: number, senderId: number, content: string) {
    await assertNotMuted(senderId, 'MESSENGER');

    const chat = await getChatForParticipant(chatId, senderId);
    if (!chat.otherUser) throw forbidden('userDeleted');

    return persistMessage(chat.id, senderId, chat.otherUser.id, content);
}

/** Opens (or reuses) the direct chat with `recipientId` and sends the first message. */
export async function startChat(senderId: number, recipientId: number, content: string) {
    if (senderId === recipientId) throw forbidden('cannotMessageSelf');

    await assertNotMuted(senderId, 'MESSENGER');

    const recipient = await db.user.findUnique({
        where: { id: recipientId },
        select: { id: true },
    });
    if (!recipient) throw notFound('userNotFound');

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

/** Marks the chat as seen and sends the "Seen" receipt to the other participant. */
export async function markChatRead(chatId: number, viewerId: number) {
    const chat = await getChatForParticipant(chatId, viewerId);

    const latest = await db.message.findFirst({
        where: { chatId, recipientUserId: viewerId, read: false },
        orderBy: { id: 'desc' },
        select: { id: true },
    });
    if (!latest) return;

    const readAt = new Date();
    await db.message.updateMany({
        where: { chatId, recipientUserId: viewerId, read: false, id: { lte: latest.id } },
        data: { read: true, readAt },
    });

    // The reader's other tabs clear the unread badge, the sender shows "Seen".
    await publishToUsers(chat.otherUser ? [viewerId, chat.otherUser.id] : [viewerId], 'chat:read', {
        chatId,
        readerId: viewerId,
        messageId: latest.id,
        readAt: readAt.toISOString(),
    });
}

/** Tells the other participant the viewer is typing (ephemeral, nothing is stored). */
export async function notifyTyping(chatId: number, viewerId: number) {
    const chat = await getChatForParticipant(chatId, viewerId);
    if (!chat.otherUser) return;

    await publishToUsers([chat.otherUser.id], 'chat:typing', { chatId, userId: viewerId });
}
