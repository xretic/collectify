import { Prisma } from '@/generated/prisma/client';
import { isProperInteger } from '@/helpers/isProperInteger';
import { CATEGORIES, PAGE_SIZE } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
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

type CollectionListRow = Prisma.CollectionGetPayload<{
    select: {
        id: true;
        name: true;
        bannerUrl: true;
        category: true;
        userId: true;
        User: {
            select: {
                id: true;
                fullName: true;
                avatarUrl: true;
            };
        };
        _count: {
            select: {
                likes: true;
                addedToFavorite: true;
                items: true;
                comments: true;
            };
        };
    };
}>;

function mapCollection(collection: CollectionListRow): CollectionFieldProps {
    return {
        id: collection.id,
        author: collection.User?.fullName ?? 'Unknown',
        authorId: collection.User?.id ?? 0,
        authorAvatarUrl: collection.User?.avatarUrl ?? '',
        bannerUrl: collection.bannerUrl,
        name: collection.name,
        category: collection.category,
        likes: collection._count.likes,
        addedToFavorite: collection._count.addedToFavorite,
        items: collection._count.items,
        comments: collection._count.comments,
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const category = searchParams.get('category');
        const userId = searchParams.get('userId');
        const sortedBy = searchParams.get('sortedBy');
        const skip = Number(searchParams.get('skip'));
        const query = searchParams.get('query')?.toLowerCase();

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
        const cacheRequired = !userId && !favoritesUserId;

        const paramsForKey = {
            category,
            userId,
            sortedBy,
            skip: String(skip),
            query,
            authorId: String(authorId || ''),
            favoritesUserId: String(favoritesUserId || ''),
        };

        const key = `collections:${JSON.stringify(paramsForKey)}`;

        if (cacheRequired) {
            const cached = await redis.getJson<{ data: CollectionFieldProps[] }>(key);
            if (cached) return NextResponse.json(cached, { status: 200 });
        }

        const selectForList = {
            id: true,
            name: true,
            bannerUrl: true,
            category: true,
            userId: true,
            User: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                },
            },
            _count: {
                select: {
                    likes: true,
                    addedToFavorite: true,
                    items: true,
                    comments: true,
                },
            },
        } satisfies Prisma.CollectionSelect;

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
                        lowerCaseName: { startsWith: query ?? '' },
                    },
                    select: selectForList,
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
                    ...(favoritesUserId && { addedToFavorite: { some: { id: favoritesUserId } } }),
                    lowerCaseName: { startsWith: query ?? '' },
                },
                select: selectForList,
                orderBy: ORDER_BY_MAP[sortedBy],
                take: PAGE_SIZE - collections.length,
                skip,
            });

            collections.push(...publicCollections.map(mapCollection));
        }

        if (cacheRequired) {
            const payload = { data: collections };
            await redis.setJson(key, payload, { ex: 30 });
        }

        return NextResponse.json({ data: collections }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
