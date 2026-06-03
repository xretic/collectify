import { canModerateTarget, requireManagementAccess, writeModerationAction } from '@/helpers/management';
import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireManagementAccess(req, true);
        if (access.response || !access.context) return access.response;

        const { id } = await params;
        const targetUserId = Number(id);

        if (!isProperInteger(targetUserId)) {
            return NextResponse.json({ message: 'Invalid user id.' }, { status: 400 });
        }

        const target = await prisma.user.findUnique({ where: { id: targetUserId } });

        if (!target) {
            return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
        }

        const targetAccess = await canModerateTarget(access.context, targetUserId);

        if (!targetAccess.ok) {
            return NextResponse.json({ message: targetAccess.message }, { status: 403 });
        }

        await writeModerationAction({
            actorId: access.context.session.userId,
            targetUserId,
            action: 'delete-user',
            metadata: {
                targetUserId,
                username: target.username,
                email: target.email,
            },
        });

        await prisma.user.delete({ where: { id: targetUserId } });

        return NextResponse.json({ message: 'User deleted.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
