import { NotificationType } from '@/generated/prisma/client';
import { collectionActionData } from '@/helpers/collectionActionsData';
import { getResData } from '@/helpers/getCollectionData';
import { isProperInteger } from '@/helpers/isProperInteger';
import { upsertNotification } from '@/helpers/upsertNotification';
import { COMMENTS_LIMIT } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        where: { id: intId },
        include: {
            items: true,
            User: true,
        },
    });

    if (!collection || !collection.User) {
        return NextResponse.json({ data: null }, { status: 404 });
    }

    const sessionId = req.cookies.get('sessionId')?.value;
    const session = sessionId
        ? await prisma.session.findUnique({
              where: { id: sessionId },
              include: {
                  user: true,
              },
          })
        : null;

    const { liked, favorited } = await collectionActionData(session, collection);

    const commentsRes = await prisma.comment.findMany({
        where: {
            collectionId: collection.id,
        },
        include: { User: true },
        orderBy: { createdAt: 'desc' },
        skip: commentsSkip,
        take: 10,
    });

    const comments = await prisma.comment.count({
        where: {
            collectionId: collection.id,
        },
    });

    const resData = getResData({ ...collection, liked, favorited, commentsRes, comments });

    return NextResponse.json(
        {
            data: resData,
        },
        { status: 200 },
    );
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { searchParams } = new URL(req.url);
        const actionType = searchParams.get('actionType');
        const actions = new Set(['like', 'dislike', 'favorite', 'unfavorite']);

        if (!actionType || !actions.has(actionType)) {
            return NextResponse.json({ data: null }, { status: 401 });
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

        const sessionUser = session.user;

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

        const collection = await prisma.collection.findUnique({
            where: { id: intId },
        });

        if (!collection) {
            return NextResponse.json({ message: 'Collection not found.' }, { status: 404 });
        }

        if (actionType === 'like') {
            const check = await prisma.like.findFirst({
                where: { userId: sessionUser.id, collectionId: collection.id },
            });

            if (check) {
                return NextResponse.json(
                    { message: 'Collection is already liked.' },
                    { status: 403 },
                );
            }
        }

        if (actionType === 'favorite') {
            const check = await prisma.collection.findFirst({
                where: {
                    id: collection.id,
                    addedToFavorite: {
                        some: {
                            id: session.userId,
                        },
                    },
                },
            });

            if (check) {
                return NextResponse.json(
                    { message: 'Collection is already favorited.' },
                    { status: 403 },
                );
            }
        }

        const updatedCollection = await prisma.collection.update({
            where: { id: intId },
            data: actionConfig[actionType],
            include: {
                items: true,
                comments: true,
                User: true,
            },
        });

        if (!updatedCollection || !updatedCollection.User) {
            return NextResponse.json({ data: null }, { status: 404 });
        }

        if (
            sessionUser.id !== updatedCollection.User.id &&
            ['like', 'favorite'].some((x) => x === actionType)
        ) {
            const notificationType: Record<'like' | 'favorite', NotificationType> = {
                like: NotificationType.LIKE,
                favorite: NotificationType.FAVORITE,
            };

            await upsertNotification(
                sessionUser.id,
                updatedCollection.User.id,
                notificationType[actionType as 'like' | 'favorite'],
                updatedCollection.id,
            );
        }

        const { liked, favorited } = await collectionActionData(session, updatedCollection);

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
