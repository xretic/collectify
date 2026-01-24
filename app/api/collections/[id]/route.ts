import { prisma } from '@/lib/prisma';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const intId = Number(id);

    if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid collection id' }, { status: 400 });
    }

    const collection = await prisma.collection.findUnique({
        where: { id: intId },
        include: {
            likes: true,
            addedToFavorite: true,
            items: true,
            User: true,
        },
    });

    if (!collection || !collection.User) {
        return NextResponse.json({ user: null }, { status: 404 });
    }

    const resData: CollectionPropsAdditional = {
        id: collection.id,
        author: collection.User.username,
        authorAvatarUrl: collection.User.avatarUrl,
        description: collection.description,
        authorId: collection.User.id,
        bannerUrl: collection.bannerUrl,
        name: collection.name,
        category: collection.category,
        likes: collection.likes.map((x) => ({
            id: x.id,
            username: x.username,
            avatarUrl: x.avatarUrl,
        })),

        addedToFavorite: collection.addedToFavorite.map((x) => ({
            id: x.id,
            username: x.username,
            avatarUrl: x.avatarUrl,
        })),

        items: collection.items.map((x) => ({
            title: x.title,
            description: x.description,
            tags: x.tags,
        })),
    };

    return NextResponse.json(
        {
            data: resData,
        },
        { status: 200 },
    );
}
