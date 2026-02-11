import { collectionActionData } from '@/helpers/collectionActionsData';
import { getResData } from '@/helpers/getCollectionData';
import { isProperInteger } from '@/helpers/isProperInteger';
import { isValidUrl } from '@/helpers/isValidUrl';
import { COMMENTS_LIMIT, ITEM_DESCRIPTION_MAX_LENGTH, ITEM_TITLE_MAX_LENGTH } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const requiredFields = ['title', 'description'] as const;

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

        const { searchParams } = new URL(req.url);
        const commentsSkip = Number(searchParams.get('commentsSkip'));

        if (!commentsSkip || !isProperInteger(commentsSkip)) {
            return NextResponse.json({ message: 'commentsSkip is required.' }, { status: 400 });
        }

        const collection = await prisma.collection.findUnique({
            where: {
                id: intId,
            },
        });

        if (!collection) {
            return NextResponse.json({ message: 'Collection not found.' }, { status: 404 });
        }

        if (session.userId !== collection.userId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const requestData = await req.json();

        if (!requiredFields.every((field) => field in requestData)) {
            return NextResponse.json({ message: 'Bad request.' }, { status: 400 });
        }

        const { title, description, sourceUrl, imageUrl } = requestData;

        if ([title, description].some((x) => typeof x !== 'string' || x.trim().length === 0)) {
            return NextResponse.json(
                { message: 'Required fields are not filled in.' },
                { status: 400 },
            );
        }

        type Rule = {
            ok: boolean;
            message: string;
            status?: number;
        };

        const badRequest = (message: string, status = 400) =>
            NextResponse.json({ message }, { status });

        const rules: Rule[] = [
            {
                ok: title.length <= ITEM_TITLE_MAX_LENGTH,
                message: `Item title length must be within ${ITEM_TITLE_MAX_LENGTH}`,
            },
            {
                ok: description.length <= ITEM_DESCRIPTION_MAX_LENGTH,
                message: `Item description length must be within ${ITEM_DESCRIPTION_MAX_LENGTH}`,
            },
            {
                ok: !sourceUrl || isValidUrl(sourceUrl),
                message: `Item source URL must be a valid URL.`,
            },
            {
                ok: !imageUrl || isValidUrl(imageUrl),
                message: `Image URL must be a valid URL.`,
            },
        ];

        const failed = rules.find((x) => !x.ok);

        if (failed) return badRequest(failed.message, failed.status);

        const itemsCount = await prisma.item.count({
            where: {
                collectionId: collection.id,
            },
        });

        await prisma.item.create({
            data: {
                collectionId: collection.id,
                title,
                description,
                order: itemsCount,
                ...(sourceUrl && { sourceUrl }),
                ...(imageUrl && { imageUrl }),
            },
        });

        const updatedCollection = await prisma.collection.findUnique({
            where: {
                id: intId,
            },
            include: {
                items: true,
                comments: true,
                User: true,
            },
        });

        const { liked, favorited } = await collectionActionData(session, collection);

        const commentsRes = await prisma.comment.findMany({
            where: {
                collectionId: collection.id,
            },
            include: { User: true },
            skip: commentsSkip,
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        const comments = await prisma.comment.count({
            where: {
                collectionId: collection.id,
            },
        });

        return NextResponse.json(
            {
                message: 'Item created.',
                data: updatedCollection
                    ? getResData({
                          ...updatedCollection,
                          liked,
                          favorited,
                          commentsRes,
                          comments,
                      })
                    : null,
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { searchParams } = new URL(req.url);
        const itemId = Number(searchParams.get('itemId'));

        if (!isProperInteger(itemId)) {
            return NextResponse.json({ message: 'Invalid item id.' }, { status: 400 });
        }

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

        const collection = await prisma.collection.findUnique({
            where: {
                id: intId,
            },
        });

        if (!collection) {
            return NextResponse.json({ message: 'Collection not found.' }, { status: 404 });
        }

        if (session.userId !== collection.userId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const item = await prisma.item.findUnique({
            where: { collectionId: collection.id, id: itemId },
        });

        if (!item) {
            return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
        }

        const itemsCount = await prisma.item.count({
            where: {
                collectionId: collection.id,
            },
        });

        if (itemsCount === 1) {
            return NextResponse.json(
                { message: 'You cannot delete the last item.' },
                { status: 403 },
            );
        }

        await prisma.item.delete({
            where: {
                id: item.id,
            },
        });

        const updatedCollection = await prisma.collection.findUnique({
            where: { id: collection.id },
            include: {
                items: true,
                comments: true,
                User: true,
            },
        });

        if (!updatedCollection) {
            return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 });
        }

        const { liked, favorited } = await collectionActionData(session, collection);

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
