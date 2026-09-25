import { z } from 'zod';
import { json, notFound, parseId, readQuery, route } from '@/shared/server/http';
import { db } from '@/shared/server/db';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { listReplies } from '@/entities/comment/server/queries';
import { getViewer } from '@/features/auth/server/guards';

const querySchema = z.object({ cursor: idSchema.optional() });

export const GET = route<{ id: string }>(async (req, params) => {
    const commentId = parseId(params.id, 'comment id');
    const viewer = await getViewer(req);
    await enforceRateLimit(req, 'search', viewer?.userId);

    const comment = await db.comment.findUnique({
        where: { id: commentId },
        select: { collection: { select: { private: true, userId: true } } },
    });

    // Same visibility as the collection itself.
    const { collection } = comment ?? {};
    if (!collection || (collection.private && collection.userId !== viewer?.userId)) {
        throw notFound('Comment not found.');
    }

    const { cursor } = readQuery(req, querySchema);
    return json(await listReplies(commentId, cursor ?? null));
});
