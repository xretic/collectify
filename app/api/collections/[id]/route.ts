import { Collection, Follow, NotificationType } from '@/generated/prisma/client';
import { isProperInteger } from '@/helpers/isProperInteger';
import { upsertNotification } from '@/helpers/upsertNotification';
import { prisma } from '@/lib/prisma';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const intId = Number(id);

    if (!isProperInteger(intId)) {
        return NextResponse.json({ message: 'Invalid collection id' }, { status: 400 });
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
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            user: true,
        },
    });

    const sessionUser = session!.user;

    const actionConfig: Record<string, any> = {
        like: {
            likes: {
                create: {
                    userId: sessionUser.id,
                },
            },
        },

        dislike: {
            likes: {
                deleteMany: {
                    userId: sessionUser.id,
                },
            },
        },

        favorite: {
            addedToFavorite: {
                connect: {
                    id: sessionUser.id,
                },
            },
        },

        unfavorite: {
            addedToFavorite: {
                disconnect: {
                    id: sessionUser.id,
                },
            },
        },
    };

    const { id } = await params;
    const intId = Number(id);

    if (!isProperInteger(intId)) {
        return NextResponse.json({ message: 'Invalid collection id' }, { status: 400 });
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
        sessionUser.id !== collection.User.id &&
        ['like', 'favorite'].some((x) => x === actionType)
    ) {
        const notificationType: Record<'like' | 'favorite', NotificationType> = {
            like: NotificationType.LIKE,
            favorite: NotificationType.FAVORITE,
        };

        await upsertNotification(
            sessionUser.id,
            collection.User.id,
            notificationType[actionType as 'like' | 'favorite'],
        );
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
