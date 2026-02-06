import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid collection id' }, { status: 400 });
        }

        const collection = await prisma.collection.findUnique({
            where: {
                id: intId,
            },
        });

        if (!collection) {
            return NextResponse.json({ message: 'Collection not found.' }, { status: 404 });
        }

        if (session.userId !== collection.userId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        await prisma.collection.delete({
            where: {
                id: collection.id,
            },
        });

        return NextResponse.json({ message: 'Collection deleted.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
