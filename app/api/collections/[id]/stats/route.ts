import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid collection id' }, { status: 400 });
        }

        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { userId: true },
        });

        if (!session) return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });

        const collection = await prisma.collection.findUnique({
            where: { id: intId },
            select: { id: true, userId: true },
        });

        if (!collection) {
            return NextResponse.json({ message: 'Collection not found.' }, { status: 404 });
        }

        if (session.userId !== collection.userId) {
            return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
        }

        const likes = await prisma.like.groupBy({
            by: ['collectionId', 'createdAt'],
            where: { collectionId: collection.id },
            _count: { id: true },
            orderBy: { createdAt: 'asc' },
        });

        const comments = await prisma.comment.groupBy({
            by: ['collectionId', 'createdAt'],
            where: { collectionId: collection.id },
            _count: { id: true },
            orderBy: { createdAt: 'asc' },
        });

        const favorites = await prisma.collection.findUnique({
            where: { id: collection.id },
            select: { addedToFavorite: { select: { createdAt: true } } },
        });

        const dayCounts = new Map<string, { likes: number; comments: number; favorites: number }>();

        const addToMap = (
            dateStr: string,
            field: 'likes' | 'comments' | 'favorites',
            count: number,
        ) => {
            if (!dayCounts.has(dateStr))
                dayCounts.set(dateStr, { likes: 0, comments: 0, favorites: 0 });
            dayCounts.get(dateStr)![field] += count;
        };

        likes.forEach((l) => {
            const day = l.createdAt.toISOString().slice(0, 10);
            addToMap(day, 'likes', l._count.id);
        });

        comments.forEach((c) => {
            const day = c.createdAt.toISOString().slice(0, 10);
            addToMap(day, 'comments', c._count.id);
        });

        (favorites?.addedToFavorite || []).forEach((f) => {
            const day = f.createdAt.toISOString().slice(0, 10);
            addToMap(day, 'favorites', 1);
        });

        const sortedDays = Array.from(dayCounts.keys()).sort();
        const likesData = sortedDays.map((d) => dayCounts.get(d)!.likes);
        const commentsData = sortedDays.map((d) => dayCounts.get(d)!.comments);
        const favoritesData = sortedDays.map((d) => dayCounts.get(d)!.favorites);

        return NextResponse.json({ days: sortedDays, likesData, commentsData, favoritesData });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
