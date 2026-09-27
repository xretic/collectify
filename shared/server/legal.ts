import 'server-only';
import { cache } from 'react';
import { db } from './db';
import { serverEnv } from './env';

/** Who runs the service, for the legal pages. Unset fields are simply left out. */
export type LegalDetails = {
    operator: string;
    address: string | null;
    email: string | null;
    /** Whose law governs the Terms. */
    country: string | null;
};

export function legalDetails(): LegalDetails {
    return {
        operator: serverEnv.LEGAL_NAME ?? 'Collectify',
        address: serverEnv.LEGAL_ADDRESS ?? null,
        email: serverEnv.CONTACT_EMAIL ?? null,
        country: serverEnv.LEGAL_COUNTRY ?? null,
    };
}

/** Legal texts whose versions live in the `LegalDocumentVersion` table. */
export const LEGAL_DOCUMENTS = {
    terms: '/terms',
    privacy: '/privacy-policy',
    cookies: '/cookies',
} as const;

export type LegalDocumentSlug = keyof typeof LEGAL_DOCUMENTS;

/** The version of a legal text in effect now. */
export type LegalVersion = { version: number; effectiveAt: Date };

/**
 * The newest version of every legal text that is already in effect (a row
 * with a future date is announced but not shown yet); one query per request.
 */
export const currentLegalVersions = cache(
    async (): Promise<Partial<Record<LegalDocumentSlug, LegalVersion>>> => {
        const rows = await db.legalDocumentVersion.findMany({
            where: { effectiveAt: { lte: new Date() } },
            orderBy: [{ slug: 'asc' }, { version: 'desc' }],
            distinct: ['slug'],
            select: { slug: true, version: true, effectiveAt: true },
        });
        return Object.fromEntries(
            rows
                .filter((row) => row.slug in LEGAL_DOCUMENTS)
                .map(({ slug, version, effectiveAt }) => [slug, { version, effectiveAt }]),
        );
    },
);

/** `null` when the text has no version yet: the page then shows no date rather than a wrong one. */
export const currentLegalVersion = async (slug: LegalDocumentSlug) =>
    (await currentLegalVersions())[slug] ?? null;
