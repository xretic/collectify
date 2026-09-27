import { NextResponse } from 'next/server';
import { forbidden, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import { exportUserData } from '@/features/user/export-data/server/exportData';

/**
 * "Download my data": a JSON file of everything stored about the signed-in user.
 * POST, not GET: a cross-site link or navigation must not be able to trigger it.
 */
export const POST = route(async (req) => {
    const viewer = await requireViewer(req);
    // Staff signed in as a user must not walk away with their data.
    if (viewer.session.impersonatorUserId) throw forbidden();
    await enforceRateLimit(req, 'export', viewer.userId);

    const data = await exportUserData(viewer.userId);
    const date = data.exportedAt.slice(0, 10);

    return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="collectify-${data.account.username}-${date}.json"`,
            'Cache-Control': 'no-store',
        },
    });
});
