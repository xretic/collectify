import { json, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { itemSchema } from '@/entities/collection/model/schemas';
import { requireViewer } from '@/features/auth/server/guards';
import { addItem } from '@/features/collection/server/items';

export const POST = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const item = await addItem(parseId(params.id), viewer.userId, await readBody(req, itemSchema));

    return json({ item }, 201);
});
