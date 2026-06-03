import {
    canModerateTarget,
    getActiveSanction,
    requireManagementAccess,
    writeModerationAction,
} from '@/helpers/management';
import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireManagementAccess(req, true);
        if (access.response || !access.context) return access.response;

        const { id } = await params;
        const targetUserId = Number(id);

        if (!isProperInteger(targetUserId)) {
            return NextResponse.json({ message: 'Invalid user id.' }, { status: 400 });
        }

        if (targetUserId === access.context.session.userId) {
            return NextResponse.json(
                { message: 'You are already signed in as this user.' },
                { status: 400 },
            );
        }

        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, username: true },
        });

        if (!target) {
            return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
        }

        const targetAccess = await canModerateTarget(access.context, targetUserId);

        if (!targetAccess.ok) {
            return NextResponse.json({ message: targetAccess.message }, { status: 403 });
        }

        const accountBan = await getActiveSanction(targetUserId, 'ACCOUNT');

        if (accountBan) {
            return NextResponse.json(
                { message: 'You cannot impersonate a banned account.' },
                { status: 403 },
            );
        }

        const impersonatorUserId =
            access.context.session.impersonatorUserId ?? access.context.session.userId;

        await prisma.session.update({
            where: { id: access.context.session.id },
            data: {
                userId: targetUserId,
                impersonatorUserId,
            },
            select: { id: true },
        });

        await writeModerationAction({
            actorId: impersonatorUserId,
            targetUserId,
            action: 'impersonate-user',
            metadata: {
                username: target.username,
            },
        });

        return NextResponse.json({ message: 'Impersonation started.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
