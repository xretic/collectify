import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db, type Tx } from '@/shared/server/db';
import { forbidden, notFound } from '@/shared/server/http';
import { PAGE_SIZE } from '@/shared/lib/constants';
import { categoryRefSelect } from '@/entities/category/server/queries';
import { tagRefSelect } from '@/entities/tag/server/queries';
import type {
    CollectionCard,
    CollectionDetails,
    CollectionListPage,
    CollectionListParams,
    CollectionSort,
} from '../model/types';

export const COLLECTIONS_CACHE_NAMESPACE = 'collections';

export const authorSelect = {
    id: true,
    username: true,
    fullName: true,
    avatarUrl: true,
} satisfies Prisma.UserSelect;

const cardSelect = {
    id: true,
    name: true,
    bannerUrl: true,
    category: { select: categoryRefSelect },
    private: true,
    user: { select: authorSelect },
    _count: { select: { likes: true, favorites: true, items: true, comments: true } },
} satisfies Prisma.CollectionSelect;

type CardRow = Prisma.CollectionGetPayload<{ select: typeof cardSelect }>;

function toCard(row: CardRow): CollectionCard {
    return {
        id: row.id,
        name: row.name,
        bannerUrl: row.bannerUrl,
        category: row.category,
        isPrivate: row.private,
        author: row.user,
        likes: row._count.likes,
        favorites: row._count.favorites,
        items: row._count.items,
        comments: row._count.comments,
    };
}

// `id` is the tie-breaker so offset pagination is deterministic.
const ORDER_BY: Record<CollectionSort, Prisma.CollectionOrderByWithRelationInput[]> = {
    newest: [{ createdAt: 'desc' }, { id: 'desc' }],
    old: [{ createdAt: 'asc' }, { id: 'asc' }],
    popular: [{ likeCount: 'desc' }, { id: 'desc' }],
};

async function findCards(
    where: Prisma.CollectionWhereInput,
    sort: CollectionSort,
    skip: number,
    take: number,
) {
    if (take <= 0) return [];

    const rows = await db.collection.findMany({
        where,
        select: cardSelect,
        orderBy: ORDER_BY[sort],
        skip,
        take,
    });

    return rows.map(toCard);
}

/** Cards for ids in the given order (e.g. ranked by a recommendation query). */
export async function findCardsByIds(ids: number[]): Promise<CollectionCard[]> {
    if (ids.length === 0) return [];

    const rows = await db.collection.findMany({ where: { id: { in: ids } }, select: cardSelect });
    const byId = new Map(rows.map((row) => [row.id, toCard(row)]));

    return ids.map((id) => byId.get(id)).filter((card) => card !== undefined);
}

function toPage(cards: CollectionCard[]): CollectionListPage {
    return { data: cards.slice(0, PAGE_SIZE), hasMore: cards.length > PAGE_SIZE };
}

/**
 * Lists collections for the home feed, a profile, "my collections" or the
 * viewer's favorites. Private collections are only ever returned to their
 * owner.
 */
export async function listCollections(
    params: CollectionListParams,
    viewerId: number | null,
): Promise<CollectionListPage> {
    const skip = params.page * PAGE_SIZE;
    const take = PAGE_SIZE + 1;

    const base: Prisma.CollectionWhereInput = {
        ...(params.category ? { category: { slug: params.category } } : {}),
        ...(params.tags?.length
            ? { AND: params.tags.map((tagId) => ({ tags: { some: { tagId } } })) }
            : {}),
        ...(params.query ? { lowerCaseName: { contains: params.query.toLowerCase() } } : {}),
    };

    if (params.board) {
        if (!viewerId) throw forbidden('Sign in to see your boards.');

        const where = {
            ...base,
            private: false,
            boards: { some: { boardId: params.board, board: { userId: viewerId } } },
        };
        return toPage(await findCards(where, params.sort, skip, take));
    }

    if (params.favorites) {
        if (!viewerId) throw forbidden('Sign in to see favorites.');

        const where = { ...base, private: false, favorites: { some: { userId: viewerId } } };
        return toPage(await findCards(where, params.sort, skip, take));
    }

    if (params.authorId) {
        const wantsPrivate = params.visibility === 'private';
        if (wantsPrivate && viewerId !== params.authorId) throw forbidden();

        const where = { ...base, userId: params.authorId, private: wantsPrivate };
        return toPage(await findCards(where, params.sort, skip, take));
    }

    const publicWhere = { ...base, private: false };
    if (!viewerId) return toPage(await findCards(publicWhere, params.sort, skip, take));

    // Home feed for a signed-in viewer: collections of followed users first,
    // then everything else, paginated across both partitions.
    const followedFilter = { user: { followers: { some: { followerId: viewerId } } } };
    const followedWhere = { ...publicWhere, ...followedFilter };
    const othersWhere = { ...publicWhere, NOT: followedFilter };

    const followedCount = await db.collection.count({ where: followedWhere });
    const followed = await findCards(followedWhere, params.sort, skip, take);
    const others = await findCards(
        othersWhere,
        params.sort,
        Math.max(0, skip - followedCount),
        take - followed.length,
    );

    return toPage([...followed, ...others]);
}

/** Throws 404 when the collection does not exist or is private to someone else. */
export async function getCollectionDetails(
    collectionId: number,
    viewerId: number | null,
): Promise<CollectionDetails> {
    const row = await db.collection.findUnique({
        where: { id: collectionId },
        select: {
            id: true,
            name: true,
            description: true,
            bannerUrl: true,
            category: { select: categoryRefSelect },
            private: true,
            createdAt: true,
            userId: true,
            user: { select: authorSelect },
            tags: {
                select: { tag: { select: tagRefSelect } },
                orderBy: { tag: { usageCount: 'desc' } },
            },
            items: { orderBy: [{ order: 'asc' }, { id: 'asc' }] },
            _count: { select: { likes: true, favorites: true, comments: true } },
            likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
            favorites: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
            boards: viewerId
                ? { where: { board: { userId: viewerId } }, select: { boardId: true } }
                : false,
        },
    });

    if (!row || !row.user) throw notFound('Collection not found.');
    if (row.private && row.userId !== viewerId) throw notFound('Collection not found.');

    return {
        id: row.id,
        name: row.name,
        description: row.description,
        bannerUrl: row.bannerUrl,
        category: row.category,
        isPrivate: row.private,
        createdAt: row.createdAt.toISOString(),
        author: row.user,
        tags: row.tags.map(({ tag }) => tag),
        items: row.items.map(({ id, title, description, sourceUrl, imageUrl, size, order }) => ({
            id,
            title,
            description,
            sourceUrl,
            imageUrl,
            size,
            order,
        })),
        likes: row._count.likes,
        favorites: row._count.favorites,
        comments: row._count.comments,
        liked: Array.isArray(row.likes) && row.likes.length > 0,
        favorited: Array.isArray(row.favorites) && row.favorites.length > 0,
        boardIds: Array.isArray(row.boards) ? row.boards.map((entry) => entry.boardId) : [],
    };
}

/** Loads a collection for a mutation and checks the viewer owns it. */
export async function getOwnedCollection(collectionId: number, viewerId: number) {
    const collection = await db.collection.findUnique({
        where: { id: collectionId },
        select: { id: true, userId: true, private: true },
    });

    if (!collection) throw notFound('Collection not found.');
    if (collection.userId !== viewerId)
        throw forbidden('Only the owner can change this collection.');

    return collection;
}

/** Public collection that anyone signed in may like / favorite / comment. */
export async function getInteractableCollection(collectionId: number) {
    const collection = await db.collection.findUnique({
        where: { id: collectionId },
        select: { id: true, userId: true, private: true },
    });

    if (!collection || collection.private) throw notFound('Collection not found.');

    return collection;
}

/** Rewrites item `order` to a dense 0..n-1 sequence (closes gaps after deletes). */
export async function normalizeItemOrder(tx: Tx, collectionId: number) {
    const items = await tx.item.findMany({
        where: { collectionId },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        select: { id: true, order: true },
    });

    await Promise.all(
        items
            .map((item, index) => ({ ...item, index }))
            .filter((item) => item.order !== item.index)
            .map((item) => tx.item.update({ where: { id: item.id }, data: { order: item.index } })),
    );
}
