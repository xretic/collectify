import { Collection, Follow } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const intId = Number(id);

    if (isNaN(intId)) {
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
    const actions = new Set(['like', 'dislike', 'favorite', 'unfavorite']);

    if (!actionType || !actions.has(actionType)) {
        return NextResponse.json({ data: null }, { status: 401 });
    }

    const sessionId = req.cookies.get('sessionId')?.value;

    if (!sessionId) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            user: true,
        },
    });

    if (!session) {
        return NextResponse.json({ data: null }, { status: 401 });
    }

    const actionConfig: Record<string, any> = {
        like: {
            likes: {
                create: {
                    userId: session.user.id,
                },
            },
        },

        dislike: {
            likes: {
                deleteMany: {
                    userId: session.user.id,
                },
            },
        },

        favorite: {
            addedToFavorite: {
                connect: {
                    id: session.user.id,
                },
            },
        },

        unfavorite: {
            addedToFavorite: {
                disconnect: {
                    id: session.user.id,
                },
            },
        },
    };

    const { id } = await params;
    const intId = Number(id);

    if (isNaN(intId)) {
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

    if (
        session.user.id !== collection.User.id &&
        ['like', 'favorite'].some((x) => x === actionType)
    ) {
        const notificationType: Record<string, string> = {
            like: 'liked your collection named',
            favorite: 'added your collection to favorites',
        };

        const message = `${session.user.username} ${notificationType[actionType]} ${collection.name}`;
        const requestData = {
            senderUserId: session.user.id,
            recipientUserId: collection.User.id,
            message: message,
        };

        const notification = await prisma.notification.findFirst({
            where: requestData,
        });

        if (!notification) {
            await prisma.notification.create({
                data: requestData,
            });
        }
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
            collectionId: number;
        }[];
        addedToFavorite: {
            id: number;
            description: string;
            bannerUrl: string;
            email: string;
            passwordHash: string | null;
            avatarUrl: string;
            username: string;
            fullName: string;
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
            email: string;
            passwordHash: string | null;
            avatarUrl: string;
            username: string;
            fullName: string;
        } | null;
    },
): CollectionPropsAdditional | null {
    if (!collection.User) return null;

    return {
        id: collection.id,
        author: collection.User.fullName,
        authorAvatarUrl: collection.User.avatarUrl,
        description: collection.description,
        authorId: collection.User.id,
        bannerUrl: collection.bannerUrl,
        name: collection.name,
        category: collection.category,
        likes: collection.likes.map((x) => ({
            id: x.userId,
        })),

        addedToFavorite: collection.addedToFavorite.map((x) => ({
            id: x.id,
        })),

        items: collection.items.map((x) => ({
            title: x.title,
            description: x.description,
            tags: x.tags,
        })),
    };
}
