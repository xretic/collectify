import { canModerateTarget, requireManagementAccess, SanctionScope, writeModerationAction } from '@/helpers/management';
import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type Body = {
    scope?: SanctionScope;
    reason?: string;
    expiresAt?: string | null;
};

const SCOPES = new Set<SanctionScope>(['ACCOUNT', 'COMMENTS', 'MESSENGER']);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireManagementAccess(req);
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

        const body = (await req.json()) as Body;

        if (!body.scope || !SCOPES.has(body.scope)) {
            return NextResponse.json({ message: 'Valid scope is required.' }, { status: 400 });
        }

        const expiresAt = parseExpiresAt(body.expiresAt);

        if (expiresAt === false) {
            return NextResponse.json({ message: 'expiresAt must be a future ISO date.' }, { status: 400 });
        }

        if (!expiresAt && !access.context.isAdmin) {
            return NextResponse.json(
                { message: 'Only admins can create permanent sanctions.' },
                { status: 403 },
            );
        }

        if (body.scope === 'ACCOUNT' && !expiresAt && !access.context.isAdmin) {
            return NextResponse.json(
                { message: 'Only admins can permanently ban users.' },
                { status: 403 },
            );
        }

        await prisma.$transaction([
            prisma.accountSanction.updateMany({
                where: {
                    userId: targetUserId,
                    scope: body.scope,
                    revokedAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
                data: { revokedAt: new Date() },
            }),
            prisma.accountSanction.create({
                data: {
                    userId: targetUserId,
                    moderatorId: access.context.session.userId,
                    scope: body.scope,
                    reason: body.reason?.trim() ?? '',
                    expiresAt,
                },
                select: { id: true },
            }),
        ]);

        if (body.scope === 'ACCOUNT') {
            await prisma.session.deleteMany({ where: { userId: targetUserId } });
        }

        await writeModerationAction({
            actorId: access.context.session.userId,
            targetUserId,
            action: `sanction:${body.scope}`,
            reason: body.reason,
            metadata: { expiresAt: expiresAt?.toISOString() ?? null },
        });

        return NextResponse.json({ message: 'Sanction created.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}

function parseExpiresAt(value: string | null | undefined) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
        return false;
    }

    return date;
}
