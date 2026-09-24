import { z } from 'zod';
import { COMMENT_MAX_LENGTH } from '@/shared/lib/constants';

export const commentTextSchema = z.object({
    text: z.string().trim().min(1, 'Comment cannot be empty.').max(COMMENT_MAX_LENGTH),
});
