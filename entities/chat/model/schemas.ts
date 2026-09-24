import { z } from 'zod';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/shared/lib/constants';

export const messageContentSchema = z
    .string()
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(DIRECT_MESSAGE_MAX_LENGTH);
