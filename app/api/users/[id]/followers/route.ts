import { z } from 'zod';
import { json, parseId, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { listFollows } from '@/entities/user/server/follows';
import { getViewer } from '@/features/auth/server/guards';

const querySchema = z.object({ cursor: idSchema.optional() });

export const GET = route<{ id: string }>(async (req, params) => {
    await enforceRateLimit(req, 'search');

    const viewer = await getViewer(req);
    const { cursor } = readQuery(req, querySchema);

    return json(
        await listFollows(parseId(params.id), 'followers', cursor ?? null, viewer?.userId ?? null),
    );
});
