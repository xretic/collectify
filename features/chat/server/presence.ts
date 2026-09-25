import 'server-only';
import { getChatPartnerIds } from '@/entities/chat/server/queries';
import { withCache } from '@/shared/server/cache';
import { getRedis } from '@/shared/server/redis';
import { publishToUsers } from '@/shared/server/realtime';
import { getOnlineUserIds } from '@/shared/server/presence';

const PARTNERS_CACHE_NAMESPACE = 'chat-partners';
/** Partner lists feed every presence poll and announcement, so they are reused briefly. */
const PARTNERS_TTL_SECONDS = 60;

/**
 * How long the last announced state of a user is remembered. Repeating it
 * (webhook + client ping, several tabs, reconnects, scripted calls) is not
 * fanned out again; presence polling corrects anything missed meanwhile.
 */
const ANNOUNCED_TTL_SECONDS = 300;
const MEMORY_ANNOUNCED_MAX = 10_000;

const memoryAnnounced = new Map<number, { online: boolean; expiresAt: number }>();

function cachedPartnerIds(userId: number) {
    return withCache(PARTNERS_CACHE_NAMESPACE, `user:${userId}`, PARTNERS_TTL_SECONDS, () =>
        getChatPartnerIds(userId),
    );
}

/** Records `online` as the user's announced state; `false` if it already was. */
async function markAnnounced(userId: number, online: boolean): Promise<boolean> {
    const redis = getRedis();
    const value = online ? '1' : '0';

    if (redis) {
        try {
            const key = `presence:announced:${userId}`;
            if ((await redis.get(key)) === value) return false;
            await redis.set(key, value, ANNOUNCED_TTL_SECONDS);
            return true;
        } catch (error) {
            console.error('[presence] announce state unavailable:', error);
        }
    }

    const now = Date.now();
    const last = memoryAnnounced.get(userId);
    if (last && last.expiresAt > now && last.online === online) return false;

    if (memoryAnnounced.size >= MEMORY_ANNOUNCED_MAX) {
        for (const [id, entry] of memoryAnnounced) {
            if (entry.expiresAt <= now) memoryAnnounced.delete(id);
        }
        if (memoryAnnounced.size >= MEMORY_ANNOUNCED_MAX) memoryAnnounced.clear();
    }
    memoryAnnounced.set(userId, { online, expiresAt: now + ANNOUNCED_TTL_SECONDS * 1000 });

    return true;
}

/**
 * Tells everyone the user chats with that they came online / went offline.
 * Only a change of the announced state is fanned out.
 */
export async function announcePresence(userId: number, online: boolean) {
    if (!(await markAnnounced(userId, online))) return;

    const partnerIds = await cachedPartnerIds(userId);
    if (partnerIds.length === 0) return;

    await publishToUsers(partnerIds, 'presence:changed', { userId, online });
}

/** Announces the user online, but only while their realtime channel really is occupied. */
export async function announceOnlineIfConnected(userId: number) {
    if (!(await getOnlineUserIds([userId])).has(userId)) return;
    await announcePresence(userId, true);
}

/** Online status of everyone the user chats with (userId → online). */
export async function getPartnersPresence(userId: number): Promise<Record<number, boolean>> {
    const partnerIds = await cachedPartnerIds(userId);
    const online = await getOnlineUserIds(partnerIds);

    return Object.fromEntries(partnerIds.map((id) => [id, online.has(id)]));
}
