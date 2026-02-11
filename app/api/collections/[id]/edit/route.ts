import { collectionActionData } from '@/helpers/collectionActionsData';
import { getResData } from '@/helpers/getCollectionData';
import { isProperInteger } from '@/helpers/isProperInteger';
import { isValidUrl } from '@/helpers/isValidUrl';
import {
    COLLECTION_DESCRIPTION_MAX_LENGTH,
    COLLECTION_NAME_MAX_LENGTH,
    COMMENTS_LIMIT,
} from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const requiredFields = ['title', 'description', 'bannerUrl'] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const requestData = await req.json();

        if (!requestData) {
            return NextResponse.json({ message: 'Data must me filled in.' }, { status: 400 });
        }

        if (!requiredFields.every((field) => field in requestData)) {
            return NextResponse.json({ message: 'Bad request.' }, { status: 400 });
        }

        const { title, description, bannerUrl } = requestData;

        if ([title, description].some((x) => typeof x !== 'string' || x.trim().length === 0)) {
            return NextResponse.json(
                { message: 'Required fields are not filled in.' },
                { status: 400 },
            );
        }

        const badRequest = (message: string, status = 400) =>
            NextResponse.json({ message }, { status });

        type Rule = {
            ok: boolean;
            message: string;
            status?: number;
        };

        const rules: Rule[] = [
            {
                ok: title.length <= COLLECTION_NAME_MAX_LENGTH,
                message: `Collection title length must be within ${COLLECTION_NAME_MAX_LENGTH}`,
            },
            {
                ok: description.length <= COLLECTION_DESCRIPTION_MAX_LENGTH,
                message: `Collection description length must be within ${COLLECTION_DESCRIPTION_MAX_LENGTH}`,
            },
        ];

        const failed = rules.find((x) => !x.ok);

        if (failed) return badRequest(failed.message, failed.status);

        const updatedCollection = await prisma.collection.update({
            where: {
                id: collection.id,
            },

            data: {
                name: title,
                lowerCaseName: title.toLowerCase(),
                description,
                ...(bannerUrl && { bannerUrl }),
            },

            include: {
                User: true,
                comments: true,
                items: true,
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
            take: COMMENTS_LIMIT,
        });

        const comments = await prisma.comment.count({
            where: {
                collectionId: collection.id,
            },
        });

        return NextResponse.json(
            {
                message: 'Collection edited.',
                data: updatedCollection
                    ? getResData({ ...updatedCollection, liked, favorited, commentsRes, comments })
                    : null,
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
