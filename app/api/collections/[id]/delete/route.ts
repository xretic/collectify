import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import {
    canModerateTarget,
    requireManagementAccess,
    writeModerationAction,
} from '@/helpers/management';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;

        if (!sessionId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

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
            const access = await requireManagementAccess(req);

            if (access.response || !access.context) {
                return access.response;
            }

            if (collection.userId) {
                const targetAccess = await canModerateTarget(access.context, collection.userId);

                if (!targetAccess.ok) {
                    return NextResponse.json({ message: targetAccess.message }, { status: 403 });
                }
            }

            await writeModerationAction({
                actorId: access.context.session.userId,
                targetUserId: collection.userId,
                targetCollectionId: collection.id,
                action: 'delete-collection',
            });
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
