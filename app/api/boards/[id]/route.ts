import { json, noContent, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { boardSchema } from '@/entities/board/model/schemas';
import { requireViewer } from '@/features/auth/server/guards';
import { deleteBoard, renameBoard } from '@/features/board/server/boards';

type Params = { id: string };

export const PATCH = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const { name } = await readBody(req, boardSchema);
    return json({ board: await renameBoard(viewer.userId, parseId(params.id), name) });
});

export const DELETE = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await deleteBoard(viewer.userId, parseId(params.id));
    return noContent();
});
