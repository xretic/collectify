import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { getOwnedBoard } from '@/entities/board/server/queries';
import {
    RECOMMENDATION_PAGES,
    recommendForBoard,
    recommendForUser,
} from '@/entities/collection/server/recommendations';
import { requireViewer } from '@/features/auth/server/guards';

const querySchema = z.object({
    page: z.coerce.number().int().min(0).max(RECOMMENDATION_PAGES).default(0),
    /** "More like this board" instead of the personal feed. */
    board: idSchema.optional(),
});

export const GET = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'search', viewer.userId);

    const { page, board } = readQuery(req, querySchema);

    if (board) {
        await getOwnedBoard(board, viewer.userId);
        return json(await recommendForBoard(viewer.userId, board, page));
    }

    return json(await recommendForUser(viewer.userId, page));
});
