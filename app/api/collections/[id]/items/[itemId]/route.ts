import { json, noContent, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { itemSchema } from '@/entities/collection/model/schemas';
import { requireViewer } from '@/features/auth/server/guards';
import { removeItem, updateItem } from '@/features/collection/server/items';

type Params = { id: string; itemId: string };

export const PATCH = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const item = await updateItem(
        parseId(params.id),
        parseId(params.itemId),
        viewer.userId,
        await readBody(req, itemSchema),
    );

    return json({ item });
});

export const DELETE = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await removeItem(parseId(params.id), parseId(params.itemId), viewer.userId);

    return noContent();
});
