import { canModerateTarget, requireManagementAccess, writeModerationAction } from '@/helpers/management';
import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/UserRole';
import { NextRequest, NextResponse } from 'next/server';

type Body = {
    role?: UserRole;
    enabled?: boolean;
    reason?: string;
};

const ROLES = new Set<UserRole>(['Admin', 'Moderator', 'Verified']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireManagementAccess(req);
        if (access.response || !access.context) return access.response;

        const { id } = await params;
        const targetUserId = Number(id);

        if (!isProperInteger(targetUserId)) {
            return NextResponse.json({ message: 'Invalid user id.' }, { status: 400 });
        }

        const body = (await req.json()) as Body;
        const role = body.role;
        const enabled = body.enabled;

        if (!role || !ROLES.has(role) || typeof enabled !== 'boolean') {
            return NextResponse.json({ message: 'role and enabled are required.' }, { status: 400 });
        }

        const target = await prisma.user.findUnique({ where: { id: targetUserId } });

        if (!target) {
            return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
        }

        if ((role === 'Admin' || role === 'Moderator') && !access.context.isAdmin) {
            return NextResponse.json(
                { message: 'Only admins can assign or revoke admins and moderators.' },
                { status: 403 },
            );
        }

        const targetAccess = await canModerateTarget(access.context, targetUserId);

        if (!targetAccess.ok) {
            return NextResponse.json({ message: targetAccess.message }, { status: 403 });
        }

        if (role === 'Admin' && !enabled) {
            const admins = await prisma.admin.count();

            if (admins <= 1) {
                return NextResponse.json(
                    { message: 'You cannot revoke the last admin.' },
                    { status: 403 },
                );
            }
        }

        if (role === 'Admin') {
            if (enabled) {
                await prisma.admin.upsert({
                    where: { userId: targetUserId },
                    update: { assignedBy: access.context.session.userId },
                    create: { userId: targetUserId, assignedBy: access.context.session.userId },
                });
            } else {
                await prisma.admin.deleteMany({ where: { userId: targetUserId } });
            }
        }

        if (role === 'Moderator') {
            if (enabled) {
                await prisma.moderator.upsert({
                    where: { userId: targetUserId },
                    update: { assignedBy: access.context.session.userId },
                    create: { userId: targetUserId, assignedBy: access.context.session.userId },
                });
            } else {
                await prisma.moderator.deleteMany({ where: { userId: targetUserId } });
            }
        }

        if (role === 'Verified') {
            if (enabled) {
                await prisma.verified.upsert({
                    where: { userId: targetUserId },
                    update: {},
                    create: { userId: targetUserId },
                });
            } else {
                await prisma.verified.deleteMany({ where: { userId: targetUserId } });
            }
        }

        await writeModerationAction({
            actorId: access.context.session.userId,
            targetUserId,
            action: `${enabled ? 'grant' : 'revoke'}:${role}`,
            reason: body.reason,
        });

        return NextResponse.json({ message: 'Role updated.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
