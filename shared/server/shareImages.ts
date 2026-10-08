import 'server-only';
import { revalidatePath } from 'next/cache';

/*
 * Share images (`opengraph-image` routes) are regenerated at most hourly. When
 * what they show changes, especially when content goes private or is deleted,
 * the stored image is dropped so it is not served for up to another hour.
 */

function revalidate(path: string) {
    try {
        revalidatePath(path);
    } catch (error) {
        console.error(`[og] revalidating ${path} failed:`, error);
    }
}

export function refreshCollectionImages(collectionIds: number[]) {
    for (const id of collectionIds) revalidate(`/collections/${id}/opengraph-image`);
}

export function refreshProfileImage(userId: number) {
    revalidate(`/users/${userId}/opengraph-image`);
}
