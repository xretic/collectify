import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type Body = {
    items: { id: number; order: number }[];
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { user: true },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const { id } = await params;
        const collectionId = Number(id);

        if (!isProperInteger(collectionId)) {
            return NextResponse.json({ message: 'Invalid collection id.' }, { status: 400 });
        }

        const collection = await prisma.collection.findUnique({
            where: {
                id: collectionId,
                userId: session.user.id,
            },
            select: { id: true },
        });

        if (!collection) {
            return NextResponse.json({ message: 'Collection not found.' }, { status: 404 });
        }

        let body: Body;

        try {
            body = (await req.json()) as Body;
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
        }

        if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json({ message: 'Body.items is required.' }, { status: 400 });
        }

        for (const it of body.items) {
            if (!isProperInteger(it.id) || !isProperInteger(it.order)) {
                return NextResponse.json(
                    { message: 'Each item must have integer id and order.' },
                    { status: 400 },
                );
            }
            if (it.order < 0) {
                return NextResponse.json({ message: 'Order must be >= 0.' }, { status: 400 });
            }
        }

        const ids = body.items.map((x) => x.id);

        const items = await prisma.item.findMany({
            where: {
                id: { in: ids },
                collectionId: collection.id,
            },
            select: { id: true },
        });

        if (items.length !== ids.length) {
            return NextResponse.json(
                { message: 'Some items do not belong to this collection.' },
                { status: 400 },
            );
        }

        const orders = body.items.map((x) => x.order);
        const uniqueOrders = new Set(orders);

        if (uniqueOrders.size !== orders.length) {
            return NextResponse.json({ message: 'Order values must be unique.' }, { status: 400 });
        }

        const itemsCount = await prisma.item.count({
            where: { collectionId: collection.id },
        });

        const maxOrder = itemsCount - 1;

        for (const order of orders) {
            if (order > maxOrder) {
                return NextResponse.json({ message: 'Order is too big.' }, { status: 400 });
            }
        }

        await prisma.$transaction(
            body.items.map((it) =>
                prisma.item.update({
                    where: { id: it.id },
                    data: { order: it.order },
                }),
            ),
        );

        return NextResponse.json({ message: 'Order updated.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
