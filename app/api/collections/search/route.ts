import { Prisma } from '@/generated/prisma/client';
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

function mapCollection(collection: any): CollectionFieldProps {
    return {
        id: collection.id,
        author: collection.User?.fullName ?? 'Unknown',
        authorId: collection.User?.id ?? null,
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
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const sortedBy = searchParams.get('sortedBy');
    const skip = Number(searchParams.get('skip'));

    if (!sortedBy || isNaN(skip)) {
        return NextResponse.json(
            { message: 'You should set skip and sortedBy value' },
            { status: 400 },
        );
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
            const subscribedCollections = await prisma.collection.findMany({
                where: {
                    userId: { in: user.subscriptions },
                    ...(category && { category }),
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
        }
    }

    if (collections.length < PAGE_SIZE) {
        const publicCollections = await prisma.collection.findMany({
            where: {
                ...(category && { category }),
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
}
