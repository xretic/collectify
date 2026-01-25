import { Collection } from '@/generated/prisma/client';
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
        return NextResponse.json({ data: null }, { status: 404 });
    }

    const resData = getResData(collection);

    return NextResponse.json(
        {
            data: resData,
        },
        { status: 200 },
    );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get('actionType');

    const token = req.cookies.get('token')?.value;

    const actions = new Set(['like', 'dislike', 'favorite', 'unfavorite']);

    if (!token || !actionType || !actions.has(actionType)) {
        return NextResponse.json({ data: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: {
            token,
        },
    });

    if (!user) {
        return NextResponse.json({ data: null }, { status: 401 });
    }

    const actionConfig: Record<string, any> = {
        like: {
            likes: {
                create: {
                    userId: user.id,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                },
            },
        },

        dislike: {
            likes: {
                deleteMany: {
                    userId: user.id,
                },
            },
        },

        favorite: {
            addedToFavorite: {
                connect: {
                    id: user.id,
                },
            },
        },

        unfavorite: {
            addedToFavorite: {
                disconnect: {
                    id: user.id,
                },
            },
        },
    };

    const { id } = await params;
    const intId = Number(id);

    if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid collection id' }, { status: 400 });
    }

    const collection = await prisma.collection.update({
        where: { id: intId },
        data: actionConfig[actionType],
        include: {
            likes: true,
            addedToFavorite: true,
            items: true,
            User: true,
        },
    });

    if (!collection || !collection.User) {
        return NextResponse.json({ data: null }, { status: 404 });
    }

    const resData = getResData(collection);

    return NextResponse.json(
        {
            data: resData,
        },
        { status: 200 },
    );
}

function getResData(
    collection: Collection & {
        likes: {
            id: number;
            userId: number;
            avatarUrl: string;
            username: string;
            collectionId: number;
        }[];
        addedToFavorite: {
            id: number;
            description: string;
            bannerUrl: string;
            token: string;
            email: string;
            passwordHash: string;
            avatarUrl: string;
            username: string;
            fullName: string;
            subscribed: number[];
            subscriptions: number[];
        }[];
        items: {
            id: number;
            description: string;
            collectionId: number | null;
            title: string;
            tags: string[];
        }[];
        User: {
            id: number;
            description: string;
            bannerUrl: string;
            token: string;
            email: string;
            passwordHash: string;
            avatarUrl: string;
            username: string;
            fullName: string;
            subscribed: number[];
            subscriptions: number[];
        } | null;
    },
): CollectionPropsAdditional | null {
    if (!collection.User) return null;

    return {
        id: collection.id,
        author: collection.User.username,
        authorAvatarUrl: collection.User.avatarUrl,
        description: collection.description,
        authorId: collection.User.id,
        bannerUrl: collection.bannerUrl,
        name: collection.name,
        category: collection.category,
        likes: collection.likes.map((x) => ({
            id: x.userId,
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
}
