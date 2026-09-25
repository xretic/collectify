import { json, readBody, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { createTagSchema, tagSearchSchema } from '@/entities/tag/model/schemas';
import { searchTags } from '@/entities/tag/server/queries';
import { getViewer, requireViewer } from '@/features/auth/server/guards';
import { findOrCreateTag } from '@/features/tag/server/tags';

export const GET = route(async (req) => {
    await enforceRateLimit(req, 'autocomplete');

    const { categoryId, query } = readQuery(req, tagSearchSchema);
    const viewer = await getViewer(req);

    return json({ tags: await searchTags(categoryId ?? null, query, viewer?.userId ?? null) });
});

export const POST = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const tag = await findOrCreateTag(viewer.userId, await readBody(req, createTagSchema));
    return json({ tag }, 201);
});
