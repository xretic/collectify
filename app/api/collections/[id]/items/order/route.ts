import { z } from 'zod';
import { noContent, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { COLLECTION_ITEMS_LIMIT } from '@/shared/lib/constants';
import { requireViewer } from '@/features/auth/server/guards';
import { reorderItems } from '@/features/collection/server/items';

const orderSchema = z.object({ itemIds: z.array(idSchema).min(1).max(COLLECTION_ITEMS_LIMIT) });

export const PUT = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const { itemIds } = await readBody(req, orderSchema);
    await reorderItems(parseId(params.id), viewer.userId, itemIds);

    return noContent();
});
