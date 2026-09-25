import 'server-only';
import { db, isUniqueViolation } from '@/shared/server/db';
import type { Locale } from '@/shared/config/i18n';
import { badRequest, conflict, forbidden, notFound } from '@/shared/server/http';
import { findCity, normalizeCityName } from '@/shared/server/geo/cities';
import {
    deliverNotifications,
    notifySocial,
    retractSocial,
} from '@/entities/notification/server/notifications';

export async function updateLocale(userId: number, locale: Locale) {
    await db.user.update({ where: { id: userId }, data: { locale }, select: { id: true } });
}

export async function updateProfile(
    userId: number,
    input: {
        username?: string;
        fullName?: string;
        description?: string;
        avatarUrl?: string;
        bannerUrl?: string;
        country?: string | null;
        city?: string | null;
        birthDate?: string | null;
    },
) {
    if (Object.keys(input).length === 0) throw badRequest('nothingToUpdate');

    const { birthDate, city, country, ...rest } = input;

    const data = {
        ...rest,
        ...(await resolveLocation(userId, country, city)),
        ...(birthDate !== undefined
            ? { birthDate: birthDate ? new Date(`${birthDate}T00:00:00Z`) : null }
            : {}),
    };

    try {
        await db.user.update({ where: { id: userId }, data, select: { id: true } });
    } catch (error) {
        if (isUniqueViolation(error)) throw conflict('usernameTaken');
        throw error;
    }
}

/**
 * Validates the city against the known cities of the (new or current) country
 * and stores its canonical name. Without a country the most populous city of
 * that name decides it. A country change drops a city that is not in it.
 */
async function resolveLocation(
    userId: number,
    country: string | null | undefined,
    city: string | null | undefined,
) {
    if (country === undefined && city === undefined) return {};

    const current = await db.user.findUnique({
        where: { id: userId },
        select: { country: true, city: true },
    });
    if (!current) throw notFound('userNotFound');

    const nextCountry = country === undefined ? current.country : country;
    const nextCity = city === undefined ? current.city : city;

    if (country === null && city) throw badRequest('countryRequiredForCity');
    if (!nextCity || (!nextCountry && !city)) {
        return { country: nextCountry, city: null, cityKey: null };
    }

    const found = await findCity(nextCity, nextCountry);
    if (!found) {
        if (city === undefined) return { country: nextCountry, city: null, cityKey: null };
        throw badRequest('cityUnknown');
    }

    return { country: found.country, city: found.name, cityKey: normalizeCityName(found.name) };
}

export async function follow(followerId: number, followingId: number) {
    if (followerId === followingId) throw forbidden('cannotFollowSelf');

    const target = await db.user.findUnique({ where: { id: followingId }, select: { id: true } });
    if (!target) throw notFound('userNotFound');

    // Only the request that actually creates the follow notifies.
    const { count } = await db.follow.createMany({
        data: { followerId, followingId },
        skipDuplicates: true,
    });
    if (count === 0) return;

    const notificationId = await notifySocial({
        type: 'FOLLOW',
        senderUserId: followerId,
        recipientUserId: followingId,
    });
    await deliverNotifications([notificationId]);
}

export async function unfollow(followerId: number, followingId: number) {
    const { count } = await db.follow.deleteMany({ where: { followerId, followingId } });
    if (count === 0) return;
    await retractSocial({ type: 'FOLLOW', senderUserId: followerId, recipientUserId: followingId });
}
