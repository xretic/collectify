import { isValidUrl } from '@/helpers/isValidUrl';
import {
    COLLECTION_DESCRIPTION_MAX_LENGTH,
    COLLECTION_NAME_MAX_LENGTH,
    ITEM_DESCRIPTION_MAX_LENGTH,
    ITEM_TITLE_MAX_LENGTH,
} from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const requiredFields = [
    'name',
    'description',
    'category',
    'banner',
    'itemTitle',
    'itemDescription',
] as const;

export async function POST(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const requestData = await req.json();

        if (!requiredFields.every((field) => field in requestData)) {
            return NextResponse.json({ message: 'Bad request.' }, { status: 400 });
        }

        const { name, description, category, banner, itemTitle, itemDescription, itemSourceUrl } =
            requestData;

        if (
            [name, description, category, itemTitle, itemDescription, banner].some(
                (x) => typeof x !== 'string' || x.trim().length === 0,
            )
        ) {
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
                ok: name.length <= COLLECTION_NAME_MAX_LENGTH,
                message: `Collection title length must be within ${COLLECTION_NAME_MAX_LENGTH}`,
            },
            {
                ok: description.length <= COLLECTION_DESCRIPTION_MAX_LENGTH,
                message: `Collection description length must be within ${COLLECTION_DESCRIPTION_MAX_LENGTH}`,
            },
            {
                ok: itemTitle.length <= ITEM_TITLE_MAX_LENGTH,
                message: `Item title length must be within ${ITEM_TITLE_MAX_LENGTH}`,
            },
            {
                ok: itemDescription.length <= ITEM_DESCRIPTION_MAX_LENGTH,
                message: `Item description length must be within ${ITEM_DESCRIPTION_MAX_LENGTH}`,
            },
            {
                ok: !itemSourceUrl || isValidUrl(itemSourceUrl),
                message: `Item source URL must be a valid URL.`,
            },
        ];

        const failed = rules.find((x) => !x.ok);

        if (failed) return badRequest(failed.message, failed.status);

        const collection = await prisma.collection.create({
            data: {
                userId: session.userId,
                name,
                description,
                category,
                bannerUrl: banner,
            },
        });

        const itemsCount = await prisma.item.count({
            where: {
                collectionId: collection.id,
            },
        });

        await prisma.item.create({
            data: {
                collectionId: collection.id,
                title: itemTitle,
                description: itemDescription,
                order: itemsCount,
                ...(itemSourceUrl && { sourceUrl: itemSourceUrl }),
            },
        });

        return NextResponse.json(
            { message: 'Collection created.', id: collection.id },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
