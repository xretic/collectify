import { json, notFound, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { findTag } from '@/entities/tag/server/queries';

export const GET = route<{ id: string }>(async (req, params) => {
    await enforceRateLimit(req, 'search');

    const tag = await findTag(parseId(params.id));
    if (!tag) throw notFound('tagNotFound');

    return json({ tag });
});
