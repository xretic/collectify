import { after } from 'next/server';
import { json, noContent, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { getCollectionDetails } from '@/entities/collection/server/queries';
import { recordView } from '@/entities/collection/server/recommendations';
import { updateCollectionSchema } from '@/entities/collection/model/schemas';
import { getViewer, requireViewer } from '@/features/auth/server/guards';
import { deleteCollection, updateCollection } from '@/features/collection/server/collections';

type Params = { id: string };

export const GET = route<Params>(async (req, params) => {
    const viewer = await getViewer(req);
    const collection = await getCollectionDetails(parseId(params.id), viewer?.userId ?? null);

    // Recorded after the response, so the page never waits on this write.
    if (viewer && !collection.isPrivate && collection.author.id !== viewer.userId) {
        const { userId } = viewer;
        after(() =>
            recordView(userId, collection.id).catch((error) =>
                console.error('[recommendations] view not recorded:', error),
            ),
        );
    }

    return json({ collection });
});

export const PATCH = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const collectionId = parseId(params.id);
    await updateCollection(
        collectionId,
        viewer.userId,
        await readBody(req, updateCollectionSchema),
    );

    return json({ collection: await getCollectionDetails(collectionId, viewer.userId) });
});

export const DELETE = route<Params>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await deleteCollection(parseId(params.id), viewer);

    return noContent();
});
