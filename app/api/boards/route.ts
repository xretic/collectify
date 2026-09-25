import { json, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { boardSchema } from '@/entities/board/model/schemas';
import { listBoards } from '@/entities/board/server/queries';
import { requireViewer } from '@/features/auth/server/guards';
import { createBoard } from '@/features/board/server/boards';

export const GET = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'search', viewer.userId);
    return json({ boards: await listBoards(viewer.userId) });
});

export const POST = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'create', viewer.userId);

    const { name } = await readBody(req, boardSchema);
    return json({ board: await createBoard(viewer.userId, name) }, 201);
});
