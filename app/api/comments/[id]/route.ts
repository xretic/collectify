import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { COMMENT_MAX_LENGTH } from '@/lib/constans';
import { getUserRoles } from '@/helpers/getUserRoles';
import { getScopedSanctionResponse, writeModerationAction } from '@/helpers/management';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;

        if (!sessionId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid comment id' }, { status: 400 });
        }

        const comment = await prisma.comment.findUnique({
            where: {
                id: intId,
            },
        });

        if (!comment) {
            return NextResponse.json({ message: 'Comment not found.' }, { status: 404 });
        }

        if (session.userId !== comment.userId) {
            const roles = await getUserRoles(session.userId);
            const isAdmin = roles.includes('Admin');
            const isModerator = roles.includes('Moderator');

            if (!isAdmin && !isModerator) {
                return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
            }

            if (isModerator && !isAdmin) {
                const targetRoles = await getUserRoles(comment.userId);

                if (targetRoles.includes('Admin') || targetRoles.includes('Moderator')) {
                    return NextResponse.json(
                        { message: 'Moderators cannot delete admin or moderator comments.' },
                        { status: 403 },
                    );
                }
            }

            await writeModerationAction({
                actorId: session.userId,
                targetUserId: comment.userId,
                targetCommentId: comment.id,
                action: 'delete-comment',
            });
        }

        await prisma.comment.delete({
            where: {
                id: comment.id,
            },
        });

        return NextResponse.json({ message: 'Comment deleted.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ message: 'Text is required.' }, { status: 400 });
        }

        if (!text.trim() || text.length === 0 || text.length > COMMENT_MAX_LENGTH) {
            return NextResponse.json(
                { message: `Text length should be within this range [0-${COMMENT_MAX_LENGTH}]` },
                { status: 400 },
            );
        }

        const sessionId = req.cookies.get('sessionId')?.value;

        if (!sessionId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const sanctionResponse = await getScopedSanctionResponse(session.userId, 'COMMENTS');
        if (sanctionResponse) return sanctionResponse;

        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid comment id' }, { status: 400 });
        }

        const comment = await prisma.comment.findUnique({
            where: {
                id: intId,
            },
        });

        if (!comment) {
            return NextResponse.json({ message: 'Comment not found.' }, { status: 404 });
        }

        if (session.userId !== comment.userId) {
            return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
        }

        await prisma.comment.update({
            where: {
                id: comment.id,
            },

            data: {
                text,
            },
        });

        return NextResponse.json({ message: 'Comment edited.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
