import { after } from 'next/server';
import { noContent, parseId, route } from '@/shared/server/http';
import { requireStaff } from '@/features/auth/server/guards';
import { deleteUserAccount } from '@/features/moderation/server/moderation';

export const DELETE = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req, { adminOnly: true });
    const deleteUploads = await deleteUserAccount(ctx, parseId(params.id));

    // Erases the account's images from the media host after the response.
    after(() =>
        deleteUploads().catch((error) => console.error('[account] uploads not deleted:', error)),
    );

    return noContent();
});
