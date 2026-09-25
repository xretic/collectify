import { json, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireChatViewer } from '@/features/auth/server/guards';
import { getPartnersPresence } from '@/features/chat/server/presence';

export const GET = route(async (req) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'search', viewer.userId);

    return json(await getPartnersPresence(viewer.userId));
});
