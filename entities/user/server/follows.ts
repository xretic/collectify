import 'server-only';
import { db } from '@/shared/server/db';
import { notFound } from '@/shared/server/http';
import { FOLLOW_LIST_PAGE_SIZE } from '@/shared/lib/constants';
import type { FollowListKind, FollowListPage } from '../model/types';

const userSelect = { id: true, username: true, fullName: true, avatarUrl: true } as const;

/**
 * Followers / following of a user, keyset-paginated by the other user's id
 * (descending) so pages never shift when people follow or unfollow meanwhile.
 * Both directions are served by an index: the primary key (followerId,
 * followingId) and (followingId, followerId).
 */
export async function listFollows(
    userId: number,
    kind: FollowListKind,
    cursor: number | null,
    viewerId: number | null,
): Promise<FollowListPage> {
    const exists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) throw notFound('userNotFound');

    const take = FOLLOW_LIST_PAGE_SIZE + 1;

    const users =
        kind === 'followers'
            ? (
                  await db.follow.findMany({
                      where: {
                          followingId: userId,
                          ...(cursor ? { followerId: { lt: cursor } } : {}),
                      },
                      orderBy: { followerId: 'desc' },
                      take,
                      select: { follower: { select: userSelect } },
                  })
              ).map((row) => row.follower)
            : (
                  await db.follow.findMany({
                      where: {
                          followerId: userId,
                          ...(cursor ? { followingId: { lt: cursor } } : {}),
                      },
                      orderBy: { followingId: 'desc' },
                      take,
                      select: { following: { select: userSelect } },
                  })
              ).map((row) => row.following);

    const page = users.slice(0, FOLLOW_LIST_PAGE_SIZE);

    const followedByViewer = viewerId
        ? new Set(
              (
                  await db.follow.findMany({
                      where: { followerId: viewerId, followingId: { in: page.map((u) => u.id) } },
                      select: { followingId: true },
                  })
              ).map((row) => row.followingId),
          )
        : new Set<number>();

    return {
        data: page.map((user) => ({ ...user, isFollowed: followedByViewer.has(user.id) })),
        nextCursor: users.length > FOLLOW_LIST_PAGE_SIZE ? page[page.length - 1].id : null,
    };
}
