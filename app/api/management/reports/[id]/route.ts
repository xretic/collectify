import {
    canModerateTarget,
    requireManagementAccess,
    SanctionScope,
    writeModerationAction,
} from '@/helpers/management';
import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type ReportVerdict = 'NO_VIOLATION' | 'INSUFFICIENT_EVIDENCE' | 'DUPLICATE' | 'GUILTY';
type Body = {
    verdict?: ReportVerdict;
    resolution?: string;
    punishment?: {
        scope?: SanctionScope;
        expiresAt?: string | null;
        reason?: string;
    } | null;
};

const VERDICTS = new Set<ReportVerdict>([
    'NO_VIOLATION',
    'INSUFFICIENT_EVIDENCE',
    'DUPLICATE',
    'GUILTY',
]);

const SCOPES = new Set<SanctionScope>(['ACCOUNT', 'COMMENTS', 'MESSENGER']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireManagementAccess(req);
        if (access.response || !access.context) return access.response;

        const { id } = await params;
        const reportId = Number(id);

        if (!isProperInteger(reportId)) {
            return NextResponse.json({ message: 'Invalid report id.' }, { status: 400 });
        }

        const report = await prisma.report.findUnique({
            where: { id: reportId },
            select: {
                id: true,
                targetUserId: true,
                commentId: true,
                status: true,
                reason: true,
            },
        });

        if (!report) {
            return NextResponse.json({ message: 'Report not found.' }, { status: 404 });
        }

        if (report.status === 'CLOSED') {
            return NextResponse.json({ message: 'Report is already closed.' }, { status: 403 });
        }

        const targetAccess = await canModerateTarget(access.context, report.targetUserId);

        if (!targetAccess.ok) {
            return NextResponse.json({ message: targetAccess.message }, { status: 403 });
        }

        const body = (await req.json()) as Body;

        if (!body.verdict || !VERDICTS.has(body.verdict)) {
            return NextResponse.json({ message: 'Valid verdict is required.' }, { status: 400 });
        }

        const punishment = body.punishment ?? null;
        const expiresAt = parseExpiresAt(punishment?.expiresAt);

        if (expiresAt === false) {
            return NextResponse.json(
                { message: 'expiresAt must be a future ISO date.' },
                { status: 400 },
            );
        }

        if (body.verdict === 'GUILTY') {
            if (!punishment?.scope || !SCOPES.has(punishment.scope)) {
                return NextResponse.json(
                    { message: 'Punishment scope is required for guilty verdict.' },
                    { status: 400 },
                );
            }

            if (!expiresAt && !access.context.isAdmin) {
                return NextResponse.json(
                    { message: 'Only admins can create permanent sanctions.' },
                    { status: 403 },
                );
            }

            await prisma.$transaction([
                prisma.accountSanction.updateMany({
                    where: {
                        userId: report.targetUserId,
                        scope: punishment.scope,
                        revokedAt: null,
                        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                    },
                    data: { revokedAt: new Date() },
                }),
                prisma.accountSanction.create({
                    data: {
                        userId: report.targetUserId,
                        moderatorId: access.context.session.userId,
                        scope: punishment.scope,
                        reason:
                            punishment.reason?.trim() || body.resolution?.trim() || report.reason,
                        expiresAt,
                    },
                    select: { id: true },
                }),
                prisma.report.update({
                    where: { id: report.id },
                    data: {
                        status: 'CLOSED',
                        verdict: body.verdict,
                        reviewedById: access.context.session.userId,
                        reviewedAt: new Date(),
                        resolution: body.resolution?.trim() ?? '',
                    },
                }),
            ]);

            if (punishment.scope === 'ACCOUNT') {
                await prisma.session.deleteMany({ where: { userId: report.targetUserId } });
            }
        } else {
            await prisma.report.update({
                where: { id: report.id },
                data: {
                    status: 'CLOSED',
                    verdict: body.verdict,
                    reviewedById: access.context.session.userId,
                    reviewedAt: new Date(),
                    resolution: body.resolution?.trim() ?? '',
                },
            });
        }

        await writeModerationAction({
            actorId: access.context.session.userId,
            targetUserId: report.targetUserId,
            targetCommentId: report.commentId,
            action: `report:${body.verdict}`,
            reason: body.resolution,
            metadata: {
                reportId: report.id,
                punishmentScope: body.verdict === 'GUILTY' ? (punishment?.scope ?? null) : null,
                punishmentExpiresAt:
                    body.verdict === 'GUILTY' ? (expiresAt?.toISOString() ?? null) : null,
            },
        });

        return NextResponse.json({ message: 'Report reviewed.' }, { status: 200 });
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
