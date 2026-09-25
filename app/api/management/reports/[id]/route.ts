import { json, parseId, readBody, route } from '@/shared/server/http';
import { getReportDetails } from '@/entities/report/server/queries';
import { requireStaff } from '@/features/auth/server/guards';
import { reviewReport } from '@/features/report/review/server/reviewReport';
import { reviewReportSchema } from '@/features/report/review/model/schema';

type Params = { id: string };

export const GET = route<Params>(async (req, params) => {
    const ctx = await requireStaff(req);

    return json({ report: await getReportDetails(ctx, parseId(params.id)) });
});

export const PATCH = route<Params>(async (req, params) => {
    const ctx = await requireStaff(req);
    const reportId = parseId(params.id);

    const result = await reviewReport(ctx, reportId, await readBody(req, reviewReportSchema));

    return json({ ...result, report: await getReportDetails(ctx, reportId) });
});
