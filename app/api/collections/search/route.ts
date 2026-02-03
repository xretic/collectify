import { Collection, Item, Like, Prisma, User } from '@/generated/prisma/client';
import { generateUniqueUserId } from '@/helpers/generateUniqueUserId';
import { isProperInteger } from '@/helpers/isProperInteger';
import { CATEGORIES, PAGE_SIZE } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { CollectionFieldProps } from '@/types/CollectionField';
import { NextRequest, NextResponse } from 'next/server';

const SORT_OPTIONS = ['popular', 'newest', 'old'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const ORDER_BY_MAP: Record<SortOption, Prisma.CollectionOrderByWithRelationInput> = {
    newest: { createdAt: 'desc' },
    old: { createdAt: 'asc' },
    popular: { likes: { _count: 'desc' } },
};

function isSortOption(value: unknown): value is SortOption {
    return typeof value === 'string' && SORT_OPTIONS.includes(value as SortOption);
}

function mapCollection(
    collection: Collection & {
        User?: { id: number; fullName?: string; avatarUrl?: string } | null;
        items: Item[];
        likes: Like[];
        addedToFavorite: User[];
    },
): CollectionFieldProps {
    return {
        id: collection.id,
        author: collection.User?.fullName ?? 'Unknown',
        authorId: collection.User?.id ?? 0,
        authorAvatarUrl: collection.User?.avatarUrl ?? '',
        bannerUrl: collection.bannerUrl,
        name: collection.name,
        category: collection.category,
        likes: collection.likes.length,
        addedToFavorite: collection.addedToFavorite.length,
        items: collection.items.length,
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const category = searchParams.get('category');
        const userId = searchParams.get('userId');
        const sortedBy = searchParams.get('sortedBy');
        const skip = Number(searchParams.get('skip'));
        const query = searchParams.get('query');

        const authorId = Number(searchParams.get('authorId'));
        const favoritesUserId = Number(searchParams.get('favoritesUserId'));

        const excludedIds: number[] = [];

        if (!sortedBy || !isProperInteger(skip)) {
            return NextResponse.json(
                { message: 'You should set skip and sortedBy value' },
                { status: 400 },
            );
        }

        if (
            (authorId && !isProperInteger(authorId)) ||
            (favoritesUserId && !isProperInteger(favoritesUserId))
        ) {
            return NextResponse.json(
                { message: 'You should set proper users id' },
                { status: 400 },
            );
        }

        if (favoritesUserId) {
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

            if (sessionUser.id !== favoritesUserId) {
                return NextResponse.json({ data: null }, { status: 401 });
            }
        }

        if (!isSortOption(sortedBy)) {
            return NextResponse.json({ message: 'Invalid sortedBy value' }, { status: 400 });
        }

        if (category) {
            if (!CATEGORIES.includes(category)) {
                return NextResponse.json(
                    { message: 'You should set a valid category name' },
                    { status: 404 },
                );
            }
        }

        const collections: CollectionFieldProps[] = [];

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: Number(userId) },
                select: { subscriptions: true },
            });

            if (user?.subscriptions.length) {
                const subscribedUserIds = user.subscriptions.map((x) => x.followingId);

                const subscribedCollections = await prisma.collection.findMany({
                    where: {
                        userId: { in: subscribedUserIds },
                        ...(category && { category }),
                        name: {
                            startsWith: query ? query : '',
                        },
                    },
                    include: {
                        User: true,
                        items: true,
                        likes: true,
                        addedToFavorite: true,
                    },
                    orderBy: ORDER_BY_MAP[sortedBy],
                    take: PAGE_SIZE,
                    skip,
                });

                collections.push(...subscribedCollections.map(mapCollection));
                excludedIds.push(...subscribedCollections.map((x) => x.id));
            }
        }

        if (collections.length < PAGE_SIZE) {
            const publicCollections = await prisma.collection.findMany({
                where: {
                    id: { notIn: excludedIds },
                    ...(authorId && { userId: authorId }),
                    ...(category && { category }),
                    ...(favoritesUserId && {
                        addedToFavorite: { some: { id: favoritesUserId } },
                    }),
                    name: {
                        startsWith: query ? query : '',
                    },
                },
                include: {
                    User: true,
                    items: true,
                    likes: true,
                    addedToFavorite: true,
                },
                orderBy: ORDER_BY_MAP[sortedBy],
                take: PAGE_SIZE - collections.length,
                skip,
            });

            collections.push(...publicCollections.map(mapCollection));
        }

        return NextResponse.json({ data: collections }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
