import type { MetadataRoute } from 'next';
import { db } from '@/shared/server/db';
import { siteUrl } from '@/shared/server/env';
import {
    currentLegalVersions,
    LEGAL_DOCUMENTS,
    type LegalDocumentSlug,
} from '@/shared/server/legal';

/** Regenerated hourly; one sitemap holds up to 50,000 URLs. */
export const revalidate = 3600;

const COLLECTIONS_LIMIT = 40_000;
const PROFILES_LIMIT = 9_000;

async function publicPages() {
    try {
        return await Promise.all([
            db.collection.findMany({
                where: { private: false },
                orderBy: { likeCount: 'desc' },
                take: COLLECTIONS_LIMIT,
                select: { id: true, createdAt: true },
            }),
            // Profiles with something to show.
            db.user.findMany({
                where: { collections: { some: { private: false } } },
                orderBy: { id: 'asc' },
                take: PROFILES_LIMIT,
                select: { id: true },
            }),
        ]);
    } catch {
        // Also generated at build time, when the database may be unreachable.
        return [[], []] as const;
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = siteUrl();
    const url = (path: string) => new URL(path, base).toString();
    const [collections, profiles] = await publicPages();
    const legalVersions = await currentLegalVersions().catch(() => ({}) as Record<string, never>);

    return [
        { url: url('/'), changeFrequency: 'hourly', priority: 1 },
        ...collections.map((collection) => ({
            url: url(`/collections/${collection.id}`),
            lastModified: collection.createdAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        })),
        ...profiles.map((profile) => ({
            url: url(`/users/${profile.id}`),
            changeFrequency: 'weekly' as const,
            priority: 0.5,
        })),
        ...(Object.entries(LEGAL_DOCUMENTS) as [LegalDocumentSlug, string][]).map(
            ([slug, path]) => ({
                url: url(path),
                lastModified: legalVersions[slug]?.effectiveAt,
                changeFrequency: 'yearly' as const,
                priority: 0.1,
            }),
        ),
        { url: url('/legal'), changeFrequency: 'yearly' as const, priority: 0.1 },
    ];
}
