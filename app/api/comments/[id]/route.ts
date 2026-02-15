import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { COMMENT_MAX_LENGTH } from '@/lib/constans';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
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
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
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
            return NextResponse.json({ message: `Text length should be within this range [0-${COMMENT_MAX_LENGTH}]` }, { status: 400 });
        }

        const sessionId = req.cookies.get('sessionId')?.value;
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
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
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



