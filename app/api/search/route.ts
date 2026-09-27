import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { getViewer } from '@/features/auth/server/guards';
import { globalSearch } from '@/features/search/server/globalSearch';
import { SEARCH_QUERY_MAX_LENGTH } from '@/features/search/model/types';

const querySchema = z.object({
    q: z.string().trim().min(1).max(SEARCH_QUERY_MAX_LENGTH),
});

export const GET = route(async (req) => {
    await enforceRateLimit(req, 'search');

    const { q } = readQuery(req, querySchema);
    const viewer = await getViewer(req);

    return json(await globalSearch(q, viewer?.userId ?? null));
});
