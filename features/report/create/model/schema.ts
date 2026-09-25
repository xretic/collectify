import { z } from 'zod';
import { REPORT_DETAILS_MAX_LENGTH } from '@/shared/lib/constants';
import { REPORT_REASONS } from '@/entities/report/model/types';
import { idSchema } from '@/shared/lib/validation/ids';

export const createReportSchema = z.object({
    target: z.discriminatedUnion('type', [
        z.object({ type: z.literal('USER'), userId: idSchema }),
        z.object({ type: z.literal('COMMENT'), commentId: idSchema }),
        z.object({ type: z.literal('COLLECTION'), collectionId: idSchema }),
    ]),
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(REPORT_DETAILS_MAX_LENGTH).default(''),
});
