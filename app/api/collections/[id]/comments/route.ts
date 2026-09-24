import { z } from 'zod';
import { json, parseId, readBody, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { getCollectionDetails } from '@/entities/collection/server/queries';
import { listComments } from '@/entities/comment/server/queries';
import { getViewer, requireViewer } from '@/features/auth/server/guards';
import { createComment } from '@/features/comment/server/comments';
import { commentTextSchema } from '@/features/comment/model/schema';

type Params = { id: string };

const querySchema = z.object({ cursor: idSchema.optional() });

export const GET = route<Params>(async (req, params) => {
    const collectionId = parseId(params.id);
    const viewer = await getViewer(req);

    // Throws 404 for private collections of other users.
    await getCollectionDetails(collectionId, viewer?.userId ?? null);

    const { cursor } = readQuery(req, querySchema);

    return json(await listComments(collectionId, cursor ?? null));
});

export const POST = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'comment', viewer.userId);

    const { text } = await readBody(req, commentTextSchema);
    const comment = await createComment(viewer, parseId(params.id), text);

    return json({ comment }, 201);
});
