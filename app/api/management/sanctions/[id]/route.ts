import {
    canModerateTarget,
    getSanctionById,
    requireManagementAccess,
    writeModerationAction,
} from '@/helpers/management';
import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireManagementAccess(req);
        if (access.response || !access.context) return access.response;

        const { id } = await params;
        const sanctionId = Number(id);

        if (!isProperInteger(sanctionId)) {
            return NextResponse.json({ message: 'Invalid sanction id.' }, { status: 400 });
        }

        const sanction = await getSanctionById(sanctionId);

        if (!sanction) {
            return NextResponse.json({ message: 'Sanction not found.' }, { status: 404 });
        }

        const targetAccess = await canModerateTarget(access.context, sanction.userId);

        if (!targetAccess.ok) {
            return NextResponse.json({ message: targetAccess.message }, { status: 403 });
        }

        if (sanction.scope === 'ACCOUNT' && !sanction.expiresAt && !access.context.isAdmin) {
            return NextResponse.json(
                { message: 'Only admins can revoke permanent account bans.' },
                { status: 403 },
            );
        }

        await prisma.accountSanction.update({
            where: { id: sanction.id },
            data: { revokedAt: new Date() },
            select: { id: true },
        });

        await writeModerationAction({
            actorId: access.context.session.userId,
            targetUserId: sanction.userId,
            action: `revoke-sanction:${sanction.scope}`,
            metadata: { sanctionId: sanction.id },
        });

        return NextResponse.json({ message: 'Sanction revoked.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
