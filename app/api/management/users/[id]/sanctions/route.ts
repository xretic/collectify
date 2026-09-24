import { json, parseId, readBody, route } from '@/shared/server/http';
import { requireStaff } from '@/features/auth/server/guards';
import { issueManualSanction } from '@/features/moderation/server/moderation';
import { issueSanctionSchema } from '@/features/moderation/model/schemas';

export const POST = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req);
    const result = await issueManualSanction(
        ctx,
        parseId(params.id, 'user id'),
        await readBody(req, issueSanctionSchema),
    );

    return json(result, 201);
});
