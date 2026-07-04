import { requireActiveSession } from '@/entities/auth/api/session';
import { prisma } from '@/shared/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/shared/api/rateLimit';

const REASONS = new Set(['spam', 'harassment', 'hate', 'scam', 'adult', 'other']);
const MAX_DETAILS = 1000;

type Body = {
    targetUserId?: number;
    messageId?: number;
    commentId?: number;
    collectionId?: number;
    reason?: string;
    details?: string;
};

export async function POST(req: NextRequest) {
    try {
        const access = await requireActiveSession(req);
        if (access.response || !access.session) return access.response;

        const limited = await rateLimit(req, 'report', String(access.session.userId));
        if (limited) return limited;

        const body = (await req.json()) as Body;
        const reason = body.reason?.trim() ?? '';
        const details = body.details?.trim() ?? '';

        if (!REASONS.has(reason)) {
            return NextResponse.json({ message: 'Valid reason is required.' }, { status: 400 });
        }

        if (details.length > MAX_DETAILS) {
            return NextResponse.json(
                { message: `Details must be ${MAX_DETAILS} characters or less.` },
                { status: 400 },
            );
        }

        let targetUserId = Number(body.targetUserId);
        const messageId = body.messageId ? Number(body.messageId) : null;
        const commentId = body.commentId ? Number(body.commentId) : null;
        const collectionId = body.collectionId ? Number(body.collectionId) : null;
        const targetedContentCount = [messageId, commentId, collectionId].filter(Boolean).length;

        if (targetedContentCount > 1) {
            return NextResponse.json(
                { message: 'Report can target one content item at a time.' },
                { status: 400 },
            );
        }

        if (messageId) {
            const message = await prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    chat: {
                        include: {
                            users: {
                                select: { id: true },
                            },
                        },
                    },
                },
            });

            if (!message) {
                return NextResponse.json({ message: 'Message not found.' }, { status: 404 });
            }

            const canSeeMessage = message.chat.users.some(
                (user) => user.id === access.session!.userId,
            );

            if (!canSeeMessage) {
                return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
            }

            targetUserId = message.userId;
        }

        if (commentId) {
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                select: {
                    id: true,
                    userId: true,
                    Collection: {
                        select: {
                            userId: true,
                            private: true,
                        },
                    },
                },
            });

            if (!comment) {
                return NextResponse.json({ message: 'Comment not found.' }, { status: 404 });
            }

            const canSeeComment =
                !comment.Collection.private ||
                comment.Collection.userId === access.session.userId ||
                comment.userId === access.session.userId;

            if (!canSeeComment) {
                return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
            }

            targetUserId = comment.userId;
        }

        if (collectionId) {
            const collection = await prisma.collection.findUnique({
                where: { id: collectionId },
                select: {
                    id: true,
                    userId: true,
                    private: true,
                },
            });

            if (!collection) {
                return NextResponse.json({ message: 'Collection not found.' }, { status: 404 });
            }

            const canSeeCollection =
                !collection.private || collection.userId === access.session.userId;

            if (!canSeeCollection) {
                return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
            }

            if (!collection.userId) {
                return NextResponse.json(
                    { message: 'Collection owner does not exist.' },
                    { status: 404 },
                );
            }

            targetUserId = collection.userId;
        }

        if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
            return NextResponse.json(
                { message: 'Valid target user is required.' },
                { status: 400 },
            );
        }

        if (targetUserId === access.session.userId) {
            return NextResponse.json({ message: 'You cannot report yourself.' }, { status: 403 });
        }

        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!target) {
            return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
        }

        await prisma.report.create({
            data: {
                reporterId: access.session.userId,
                targetUserId,
                messageId,
                commentId,
                collectionId,
                reason,
                details,
            },
            select: { id: true },
        });

        return NextResponse.json({ message: 'Report submitted.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
