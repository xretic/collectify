import { z } from 'zod';
import { COMMENT_MAX_LENGTH } from '@/shared/lib/constants';
import { idSchema } from '@/shared/lib/validation/ids';

export const commentTextSchema = z.object({
    text: z.string().trim().min(1, 'Comment cannot be empty.').max(COMMENT_MAX_LENGTH),
});

export const createCommentSchema = commentTextSchema.extend({
    /** Comment being answered; the reply joins that comment's thread. */
    replyToId: idSchema.optional(),
});
