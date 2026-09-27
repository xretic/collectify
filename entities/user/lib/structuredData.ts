import { absoluteUrl, interactionCounter, SCHEMA_CONTEXT } from '@/shared/lib/seo/structuredData';
import type { PublicUser } from '../model/types';

/** A profile as a schema.org ProfilePage about the person. */
export function profileStructuredData(base: URL, user: PublicUser) {
    return {
        '@context': SCHEMA_CONTEXT,
        '@type': 'ProfilePage',
        url: absoluteUrl(base, `/users/${user.id}`),
        mainEntity: {
            '@type': 'Person',
            name: user.fullName,
            alternateName: `@${user.username}`,
            identifier: user.username,
            description: user.description || undefined,
            image: user.avatarUrl || undefined,
            interactionStatistic: [interactionCounter('FollowAction', user.followers)],
        },
    };
}
