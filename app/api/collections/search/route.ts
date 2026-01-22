import { prisma } from '@/lib/prisma';
import { CollectionFieldProps } from '@/types/CollectionField';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const sortedBy = searchParams.get('sortedBy');
    const skip = searchParams.get('skip');

    let collectionsToSend: CollectionFieldProps[] = [];

    if (!skip || !sortedBy) {
        return NextResponse.json(
            { message: 'You should set skip and sortedBy option' },
            { status: 400 },
        );
    }

    if (category) {
        const check = await prisma.category.findFirst({
            where: {
                title: category,
            },
        });

        if (!check) {
            return NextResponse.json(
                { message: 'You should set a valid category name' },
                { status: 404 },
            );
        }
    }

    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
        });

        if (user && user.subscriptions.length > 0) {
            const subscriptions = await prisma.collection.findMany({
                where: {
                    userId: user.id,
                },
                include: { items: true },
                take: 8,
            });

            for (const subscription of subscriptions) {
                if (!subscription.userId) {
                    return NextResponse.json([], { status: 200 });
                }

                const author = await prisma.user.findUnique({
                    where: {
                        id: subscription.userId,
                    },
                });

                if (!author) {
                    return NextResponse.json([], { status: 200 });
                }

                collectionsToSend.push({
                    id: subscription.id,
                    author: author.fullName,
                    authorAvatarUrl: author.avatarUrl,
                    bannerUrl: subscription.bannerUrl,
                    name: subscription.name,
                    category: subscription.category,
                    likes: subscription.likes.length,
                    addedToFavorite: subscription.addedToFavorite.length,
                    items: subscription.items.length,
                });
            }
        }
    }

    const publicCollections = await prisma.collection.findMany({
        where: {},
        take: 8 - collectionsToSend.length,
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            name: true,
            bannerUrl: true,
            category: true,
            userId: true,
            likes: true,
            addedToFavorite: true,
            items: true,
        },
    });

    return NextResponse.json({
        query: category,
    });
}
