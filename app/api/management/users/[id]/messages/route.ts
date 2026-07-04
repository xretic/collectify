import { canModerateTarget, requireManagementAccess } from '@/entities/management/api/server';
import { isProperInteger } from '@/shared/lib/validation/isProperInteger';
import { prisma } from '@/shared/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const TAKE_CHATS = 10;
const TAKE_MESSAGES = 10;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireManagementAccess(req, true);
        if (access.response || !access.context) return access.response;

        const { id } = await params;
        const userId = Number(id);

        if (!isProperInteger(userId)) {
            return NextResponse.json({ message: 'Invalid user id.' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const skip = Number(searchParams.get('skip') ?? 0);

        if (!Number.isInteger(skip) || skip < 0) {
            return NextResponse.json(
                { message: 'skip must be a non-negative integer.' },
                { status: 400 },
            );
        }

        const target = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, avatarUrl: true },
        });

        if (!target) {
            return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
        }

        const targetAccess = await canModerateTarget(access.context, userId);

        if (!targetAccess.ok) {
            return NextResponse.json({ message: targetAccess.message }, { status: 403 });
        }

        const [chats, total] = await prisma.$transaction([
            prisma.chat.findMany({
                where: {
                    users: { some: { id: userId } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: TAKE_CHATS,
                include: {
                    users: {
                        select: { id: true, username: true, avatarUrl: true },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: TAKE_MESSAGES,
                        include: {
                            user: {
                                select: { id: true, username: true, avatarUrl: true },
                            },
                        },
                    },
                },
            }),
            prisma.chat.count({
                where: {
                    users: { some: { id: userId } },
                },
            }),
        ]);

        return NextResponse.json(
            {
                user: target,
                total,
                nextSkip: skip + TAKE_CHATS < total ? skip + TAKE_CHATS : null,
                chats: chats.map((chat) => ({
                    id: chat.id,
                    createdAt: chat.createdAt,
                    users: chat.users,
                    messages: chat.messages
                        .slice()
                        .reverse()
                        .map((message) => ({
                            id: message.id,
                            userId: message.userId,
                            username: message.user.username,
                            userAvatarUrl: message.user.avatarUrl,
                            recipientUserId: message.recipientUserId,
                            content: message.content,
                            createdAt: message.createdAt,
                            read: message.read,
                        })),
                })),
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
