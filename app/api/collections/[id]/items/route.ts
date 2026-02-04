import { getResData } from '@/helpers/getCollectionData';
import { isProperInteger } from '@/helpers/isProperInteger';
import { isValidUrl } from '@/helpers/isValidUrl';
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_TITLE_MAX_LENGTH } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const requiredFields = ['title', 'description'] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
                likes: true,
                addedToFavorite: true,
                items: true,
                User: true,
            },
        });

        return NextResponse.json(
            {
                message: 'Item created.',
                data: updatedCollection ? getResData(updatedCollection) : null,
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
