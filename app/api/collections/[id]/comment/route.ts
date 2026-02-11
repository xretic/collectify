import { collectionActionData } from '@/helpers/collectionActionsData';
import { getResData } from '@/helpers/getCollectionData';
import { isProperInteger } from '@/helpers/isProperInteger';
import { COMMENT_MAX_LENGTH, COMMENTS_LIMIT } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                user: true,
            },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid collection id' }, { status: 400 });
        }

        const collection = await prisma.collection.findUnique({
            where: {
                id: intId,
            },
        });

        if (!collection) {
            return NextResponse.json({ message: 'Collection not found.' }, { status: 404 });
        }

        const { text } = await req.json();

        if (!text || text.length === 0 || text.length > COMMENT_MAX_LENGTH) {
            return NextResponse.json({ message: 'Invalid text.' }, { status: 400 });
        }

        const limitCount = await prisma.comment.count({
            where: {
                userId: session.userId,
                collectionId: collection.id,
            },
        });

        if (limitCount >= COMMENTS_LIMIT) {
            return NextResponse.json({ message: 'You have reached a limit.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const replyCommentId = Number(searchParams.get('replyCommentId'));
        const raw = searchParams.get('commentsSkip');

        if (raw === null) {
            return NextResponse.json({ message: 'commentsSkip is required.' }, { status: 400 });
        }

        const commentsSkip = Number(raw);

        if (!isProperInteger(commentsSkip)) {
            return NextResponse.json(
                { message: 'commentsSkip must be a non-negative integer.' },
                { status: 400 },
            );
        }

        if (replyCommentId && !isProperInteger(replyCommentId)) {
            return NextResponse.json(
                { message: 'Reply comment ID must be valid.' },
                { status: 400 },
            );
        }

        if (replyCommentId) {
            const replyCheck = await prisma.comment.findUnique({
                where: {
                    id: replyCommentId,
                },
            });

            if (!replyCheck) {
                return NextResponse.json({
                    message: 'Comment that you are trying to reply is not valid.',
                });
            }
        }

        await prisma.comment.create({
            data: {
                userId: session.userId,
                collectionId: collection.id,
                text,
                ...(replyCommentId && { replyCommentId }),
            },
        });

        const updatedCollection = await prisma.collection.findUnique({
            where: {
                id: collection.id,
            },
            include: { items: true, User: true },
        });

        if (!updatedCollection) {
            return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
        }

        const { liked, favorited } = await collectionActionData(session, updatedCollection);

        const commentsRes = await prisma.comment.findMany({
            where: {
                collectionId: collection.id,
            },
            include: { User: true },
            skip: commentsSkip,
            orderBy: { createdAt: 'desc' },
            take: COMMENTS_LIMIT,
        });

        const comments = await prisma.comment.count({
            where: {
                collectionId: collection.id,
            },
        });

        const resData = getResData({
            ...updatedCollection,
            liked,
            favorited,
            commentsRes,
            comments,
        });

        return NextResponse.json(
            {
                data: resData,
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
