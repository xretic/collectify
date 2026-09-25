import { z } from 'zod';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/shared/lib/constants';

export const messageContentSchema = z
    .string()
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(DIRECT_MESSAGE_MAX_LENGTH);

export const MUTE_DURATIONS = ['15m', '30m', '1h', '8h', '1d', '1w', 'forever'] as const;

export type MuteDuration = (typeof MUTE_DURATIONS)[number];

export const muteDurationSchema = z.enum(MUTE_DURATIONS);
