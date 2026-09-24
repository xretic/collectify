import { z } from 'zod';
import { json, readBody, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { withCache } from '@/shared/server/cache';
import { CATEGORIES } from '@/shared/lib/constants';
import { idSchema } from '@/shared/lib/validation/ids';
import { COLLECTIONS_CACHE_NAMESPACE, listCollections } from '@/entities/collection/server/queries';
import { COLLECTION_SORTS } from '@/entities/collection/model/types';
import { createCollectionSchema } from '@/entities/collection/model/schemas';
import { getViewer, requireViewer } from '@/features/auth/server/guards';
import { createCollection } from '@/features/collection/server/collections';

const listSchema = z.object({
    sort: z.enum(COLLECTION_SORTS).default('popular'),
    page: z.coerce.number().int().min(0).max(10_000).default(0),
    category: z.enum(CATEGORIES).optional(),
    query: z.string().trim().max(100).optional(),
    authorId: idSchema.optional(),
    visibility: z.enum(['public', 'private']).optional(),
    favorites: z
        .enum(['true', 'false'])
        .optional()
        .transform((value) => value === 'true'),
});

export const GET = route(async (req) => {
    await enforceRateLimit(req, 'search');

    const params = readQuery(req, listSchema);
    const viewer = await getViewer(req);

    // Only the anonymous public feed is identical for everyone, so only it is cached.
    const cacheable = !viewer && !params.favorites && params.visibility !== 'private';

    const page = cacheable
        ? await withCache(COLLECTIONS_CACHE_NAMESPACE, JSON.stringify(params), 30, () =>
              listCollections(params, null),
          )
        : await listCollections(params, viewer?.userId ?? null);

    return json(page);
});

export const POST = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'create', viewer.userId);

    const id = await createCollection(viewer.userId, await readBody(req, createCollectionSchema));

    return json({ id }, 201);
});
