import { json, noContent, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import { deleteComment, updateComment } from '@/features/comment/server/comments';
import { commentTextSchema } from '@/features/comment/model/schema';

type Params = { id: string };

export const PATCH = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'comment', viewer.userId);

    const { text } = await readBody(req, commentTextSchema);
    const comment = await updateComment(viewer, parseId(params.id), text);

    return json({ comment });
});

export const DELETE = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await deleteComment(viewer, parseId(params.id));

    return noContent();
});
