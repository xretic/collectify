import { z } from 'zod';
import { MODERATION_NOTE_MAX_LENGTH } from '@/shared/lib/constants';
import { REVIEW_VERDICTS } from '@/entities/report/model/types';
import { SANCTION_DURATIONS, SANCTION_SCOPES } from '@/entities/sanction/model/types';
import { idSchema } from '@/shared/lib/validation/ids';

export const reviewReportSchema = z
    .object({
        verdict: z.enum(REVIEW_VERDICTS),
        resolution: z.string().trim().max(MODERATION_NOTE_MAX_LENGTH).default(''),
        removeContent: z.boolean().default(false),
        punishment: z
            .object({
                scope: z.enum(SANCTION_SCOPES),
                duration: z.enum(SANCTION_DURATIONS),
            })
            .nullable()
            .default(null),
        duplicateOfId: idSchema.nullable().default(null),
    })
    .refine((value) => value.verdict === 'GUILTY' || (!value.punishment && !value.removeContent), {
        message: 'Punishment and content removal require a guilty verdict.',
    })
    .refine((value) => value.verdict !== 'DUPLICATE' || value.duplicateOfId !== null, {
        message: 'Select the original report for a duplicate verdict.',
        path: ['duplicateOfId'],
    });
