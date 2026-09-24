import { noContent, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import { disengage, engage } from '@/features/collection/server/engagement';

export const PUT = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await engage('LIKE', parseId(params.id), viewer.userId);
    return noContent();
});

export const DELETE = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    await disengage('LIKE', parseId(params.id), viewer.userId);
    return noContent();
});
