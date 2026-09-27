import 'server-only';
import { db } from '@/shared/server/db';
import { canDeleteUploads, deleteUploadcareFiles, uploadcareIds } from '@/shared/server/uploadcare';

/** Every image URL an account owns: avatar, banner, collection covers and item images. */
async function ownedImageUrls(userId: number) {
    const [user, collections, items] = await Promise.all([
        db.user.findUnique({ where: { id: userId }, select: { avatarUrl: true, bannerUrl: true } }),
        db.collection.findMany({ where: { userId }, select: { bannerUrl: true } }),
        db.item.findMany({
            where: { collection: { userId }, imageUrl: { not: null } },
            select: { imageUrl: true },
        }),
    ]);

    return [
        user?.avatarUrl,
        user?.bannerUrl,
        ...collections.map((collection) => collection.bannerUrl),
        ...items.map((item) => item.imageUrl),
    ];
}

const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/**
 * Of `ids`, the uploads no remaining profile, collection or item points to
 * (someone may have reused an image URL). One pass over each table.
 */
async function unreferencedUploads(ids: string[]) {
    if (ids.length === 0) return [];

    const used = await db.$queryRaw<{ id: string }[]>`
        WITH urls AS (
            SELECT "avatarUrl" AS url FROM "User"
            UNION ALL SELECT "bannerUrl" FROM "User"
            UNION ALL SELECT "bannerUrl" FROM "Collection"
            UNION ALL SELECT "imageUrl" FROM "Item" WHERE "imageUrl" IS NOT NULL
        ),
        found AS (SELECT substring(url FROM ${UUID_PATTERN}::text) AS id FROM urls)
        SELECT DISTINCT id FROM found WHERE id = ANY(${ids}::text[])
    `;
    const stillUsed = new Set(used.map((row) => row.id));

    return ids.filter((id) => !stillUsed.has(id));
}

/**
 * Call before deleting an account: remembers its uploaded images and returns a
 * cleanup that erases the ones nobody else uses from the media host. Run the
 * cleanup after the account is gone (e.g. in `after()`); without the Uploadcare
 * secret key it does nothing.
 */
export async function prepareUploadCleanup(userId: number): Promise<() => Promise<void>> {
    const uploads = canDeleteUploads() ? uploadcareIds(await ownedImageUrls(userId)) : [];

    return async () => deleteUploadcareFiles(await unreferencedUploads(uploads));
}
