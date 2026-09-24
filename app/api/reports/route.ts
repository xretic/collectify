import { json, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import { createReport } from '@/features/report/create/server/createReport';
import { createReportSchema } from '@/features/report/create/model/schema';

export const POST = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'report', viewer.userId);

    await createReport(viewer.userId, await readBody(req, createReportSchema));

    return json({ message: 'Report submitted. Thank you!' }, 201);
});
