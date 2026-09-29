import type { CollectionListParams } from '@/entities/collection/model/types';
import { parseFeedParams } from '@/features/collection/browse/lib/feedParams';

export type ProfileTab = 'created' | 'favorites' | 'private';

/**
 * Tab and list query of a profile's collections from its URL. Shared by the
 * widget and the page's server prefetch, so both build the same query key.
 * `own`: the viewer's own profile (favorites and private tabs).
 */
export function profileListParams(
    get: (key: string) => string | null | undefined,
    authorId: number,
    own: boolean,
): { tab: ProfileTab; board: number | undefined; params: CollectionListParams } {
    const { sort, query } = parseFeedParams(get);
    const page = Math.max(0, Number(get('page')) || 0);
    const tabParam = get('tab');
    const boardParam = Number(get('board'));
    const board = Number.isInteger(boardParam) && boardParam > 0 ? boardParam : undefined;
    const tab: ProfileTab =
        own && (tabParam === 'favorites' || tabParam === 'private') ? tabParam : 'created';

    return {
        tab,
        board,
        params: {
            sort,
            page,
            query,
            ...(tab === 'favorites'
                ? board
                    ? { board }
                    : { favorites: true }
                : { authorId, visibility: tab === 'private' ? 'private' : 'public' }),
        },
    };
}
