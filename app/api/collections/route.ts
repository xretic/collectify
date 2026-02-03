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

        const {
            name,
            description,
            category,
            banner,
            itemImage,
            itemTitle,
            itemDescription,
            itemSourceUrl,
        } = requestData;

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

        const collection = await prisma.collection.create({
            data: {
                userId: session.userId,
                name,
                description,
                category,
                bannerUrl: banner,
            },
        });

        console.log({
            collectionId: collection.id,
            title: itemTitle,
            description: itemDescription,
            ...(itemSourceUrl && { sourceUrl: itemSourceUrl }),
            ...(itemImage && { imageUrl: itemImage }),
        });

        await prisma.item.create({
            data: {
                collectionId: collection.id,
                title: itemTitle,
                description: itemDescription,
                ...(itemSourceUrl && { sourceUrl: itemSourceUrl }),
                ...(itemImage && { imageUrl: itemImage }),
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
