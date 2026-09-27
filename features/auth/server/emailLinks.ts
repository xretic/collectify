import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { createTranslator } from 'next-intl';
import type { EmailTokenKind } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { apiError, badRequest } from '@/shared/server/http';
import { isProduction, serverEnv } from '@/shared/server/env';
import { isEmailConfigured, sendEmail } from '@/shared/server/email';
import { loadMessages } from '@/shared/i18n/request';
import type { Messages } from '@/shared/i18n/types';
import { DEFAULT_LOCALE, isLocale } from '@/shared/config/i18n';
import { EMAIL_VERIFICATION_TTL_DAYS, PASSWORD_RESET_TTL_HOURS } from '@/shared/lib/constants';
import { isPlaceholderEmail } from '@/entities/user/lib/email';

const HOUR_MS = 60 * 60 * 1000;

const TTL_MS: Record<EmailTokenKind, number> = {
    PASSWORD_RESET: PASSWORD_RESET_TTL_HOURS * HOUR_MS,
    EMAIL_VERIFICATION: EMAIL_VERIFICATION_TTL_DAYS * 24 * HOUR_MS,
};

const recipientSelect = {
    id: true,
    email: true,
    fullName: true,
    locale: true,
    emailVerifiedAt: true,
} as const;

type Recipient = { id: number; email: string; fullName: string; locale: string };

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Origin for links in emails. Production requires `APP_URL`: a link built from
 * the request's Host header could be pointed at another site by the requester
 * (password reset poisoning).
 */
export function emailLinkOrigin(req: NextRequest): string | null {
    if (isProduction && (!serverEnv.APP_URL || !isEmailConfigured())) return null;
    return (serverEnv.APP_URL ?? req.nextUrl.origin).replace(/\/+$/, '');
}

/** Like `emailLinkOrigin`, but a 503 when emails cannot be sent. */
export function requireEmailLinkOrigin(req: NextRequest): string {
    const origin = emailLinkOrigin(req);
    if (!origin) throw apiError(503, 'emailNotConfigured');
    return origin;
}

/** A new link replaces the user's previous one of the same kind. */
async function issueToken(userId: number, kind: EmailTokenKind) {
    const token = randomBytes(32).toString('base64url');

    await db.$transaction([
        // Expired links of everyone go too, so the table stays small.
        db.emailToken.deleteMany({
            where: { OR: [{ userId, kind }, { expiresAt: { lte: new Date() } }] },
        }),
        db.emailToken.create({
            data: {
                id: hashToken(token),
                userId,
                kind,
                expiresAt: new Date(Date.now() + TTL_MS[kind]),
            },
        }),
    ]);

    return token;
}

/** Redeems a link exactly once; returns its user. */
export async function consumeToken(token: string, kind: EmailTokenKind): Promise<number> {
    const id = hashToken(token);
    const row = await db.emailToken.findUnique({
        where: { id },
        select: { userId: true, kind: true, expiresAt: true },
    });
    if (!row || row.kind !== kind) throw badRequest('linkInvalid');

    // Deleting before acting keeps the link single-use under concurrent requests.
    const { count } = await db.emailToken.deleteMany({ where: { id } });
    if (count === 0) throw badRequest('linkInvalid');
    if (row.expiresAt <= new Date()) throw badRequest('linkExpired');

    return row.userId;
}

async function emailTranslator(locale: string) {
    const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE;
    const messages = (await loadMessages(resolved)) as Messages;
    return createTranslator({ locale: resolved, messages, namespace: 'emails' });
}

async function sendPasswordResetEmail(user: Recipient, origin: string) {
    const token = await issueToken(user.id, 'PASSWORD_RESET');
    const t = await emailTranslator(user.locale);

    await sendEmail(user.email, {
        subject: t('passwordReset.subject'),
        preheader: t('passwordReset.preheader'),
        heading: t('passwordReset.heading'),
        paragraphs: [t('greeting', { name: user.fullName }), t('passwordReset.intro')],
        button: {
            label: t('passwordReset.button'),
            url: `${origin}/auth/reset-password?token=${token}`,
        },
        notes: [
            t('passwordReset.expires', { hours: PASSWORD_RESET_TTL_HOURS }),
            t('passwordReset.ignore'),
        ],
        linkCaption: t('linkCaption'),
        footer: t('footer'),
    });
}

async function sendVerificationEmail(user: Recipient, origin: string) {
    const token = await issueToken(user.id, 'EMAIL_VERIFICATION');
    const t = await emailTranslator(user.locale);

    await sendEmail(user.email, {
        subject: t('verification.subject'),
        preheader: t('verification.preheader'),
        heading: t('verification.heading'),
        paragraphs: [t('greeting', { name: user.fullName }), t('verification.intro')],
        button: {
            label: t('verification.button'),
            url: `${origin}/auth/verify-email?token=${token}`,
        },
        notes: [
            t('verification.expires', { days: EMAIL_VERIFICATION_TTL_DAYS }),
            t('verification.ignore'),
        ],
        linkCaption: t('linkCaption'),
        footer: t('footer'),
    });
}

/** Silently does nothing for unknown addresses, so the endpoint does not reveal accounts. */
export async function requestPasswordReset(email: string, origin: string) {
    const user = await db.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: recipientSelect,
    });
    if (!user || isPlaceholderEmail(user.email)) return;

    await sendPasswordResetEmail(user, origin);
}

/** Returns `false` when there is nothing to confirm (already confirmed or no real address). */
export async function requestEmailConfirmation(userId: number, origin: string) {
    const user = await db.user.findUnique({ where: { id: userId }, select: recipientSelect });
    if (!user || user.emailVerifiedAt || isPlaceholderEmail(user.email)) return false;

    await sendVerificationEmail(user, origin);
    return true;
}

export async function confirmEmail(token: string) {
    const userId = await consumeToken(token, 'EMAIL_VERIFICATION');

    await db.user.updateMany({
        where: { id: userId, emailVerifiedAt: null },
        data: { emailVerifiedAt: new Date() },
    });

    return userId;
}

/** `catch` handler for emails sent after the response: the requester never sees the failure. */
export function logEmailFailure(label: string) {
    return (error: unknown) => console.error(`[email] ${label}`, error);
}
