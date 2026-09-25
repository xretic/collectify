import { noContent, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import { removeFromBoard, saveToBoard } from '@/features/board/server/boards';

type Params = { id: string; collectionId: string };

const handler = (save: boolean) =>
    route<Params>(async (req, params) => {
        const viewer = await requireViewer(req);
        await enforceRateLimit(req, 'mutation', viewer.userId);

        const boardId = parseId(params.id);
        const collectionId = parseId(params.collectionId);

        if (save) await saveToBoard(viewer.userId, boardId, collectionId);
        else await removeFromBoard(viewer.userId, boardId, collectionId);

        return noContent();
    });

export const PUT = handler(true);
export const DELETE = handler(false);
