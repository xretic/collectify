import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { idSchema } from '@/shared/lib/validation/ids';
import { listReports } from '@/entities/report/server/queries';
import { REPORT_REASONS, REPORT_TARGET_TYPES } from '@/entities/report/model/types';
import { requireStaff } from '@/features/auth/server/guards';

const querySchema = z.object({
    status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
    targetType: z.enum(REPORT_TARGET_TYPES).optional(),
    reason: z.enum(REPORT_REASONS).optional(),
    cursor: idSchema.optional(),
});

export const GET = route(async (req) => {
    const ctx = await requireStaff(req);
    const { cursor, ...filters } = readQuery(req, querySchema);

    return json(await listReports(ctx, { ...filters, cursor: cursor ?? null }));
});
