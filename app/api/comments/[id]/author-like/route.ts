import { noContent, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import { setAuthorLike } from '@/features/comment/server/comments';

type Params = { id: string };

const handler = (liked: boolean) =>
    route<Params>(async (req, params) => {
        const viewer = await requireViewer(req);
        await enforceRateLimit(req, 'mutation', viewer.userId);

        await setAuthorLike(viewer, parseId(params.id, 'comment id'), liked);
        return noContent();
    });

export const PUT = handler(true);
export const DELETE = handler(false);
