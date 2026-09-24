import { z } from 'zod';
import { MODERATION_NOTE_MAX_LENGTH } from '@/shared/lib/constants';
import { SANCTION_DURATIONS, SANCTION_SCOPES } from '@/entities/sanction/model/types';

export const issueSanctionSchema = z.object({
    scope: z.enum(SANCTION_SCOPES),
    duration: z.enum(SANCTION_DURATIONS),
    reason: z.string().trim().max(MODERATION_NOTE_MAX_LENGTH).default(''),
});

/** Admin role is managed with `npm run admin` only (see scripts/admin.ts). */
export const MANAGEABLE_ROLES = ['Moderator', 'Verified'] as const;

export const setRoleSchema = z.object({
    role: z.enum(MANAGEABLE_ROLES),
    enabled: z.boolean(),
    reason: z.string().trim().max(MODERATION_NOTE_MAX_LENGTH).default(''),
});
