import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { createTranslator } from 'next-intl';
import type { EmailTokenKind } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { apiError, badRequest } from '@/shared/server/http';
import { isProduction, serverEnv } from '@/shared/server/env';
import { canSendEmailLinks, sendEmail } from '@/shared/server/email';
import { loadMessages } from '@/shared/i18n/request';
import type { Messages } from '@/shared/i18n/types';
import { DEFAULT_LOCALE, isLocale } from '@/shared/config/i18n';
import { EMAIL_VERIFICATION_TTL_DAYS, PASSWORD_RESET_TTL_HOURS } from '@/shared/lib/constants';
import { isPlaceholderEmail } from '@/entities/user/lib/email';
import { dropRevokedConnections } from '@/shared/server/realtime';

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

/** Origin for links in emails, or `null` when they cannot be sent (see `canSendEmailLinks`). */
export function emailLinkOrigin(req: NextRequest): string | null {
    if (!canSendEmailLinks()) return null;
    return (serverEnv.APP_URL ?? req.nextUrl.origin).replace(/\/+$/, '');
}

/** An account that cannot be used until its address is confirmed. */
export function needsEmailConfirmation(account: { email: string; emailVerifiedAt: Date | null }) {
    // A placeholder (OAuth without a shared address) has nothing to confirm.
    return (
        canSendEmailLinks() &&
        account.emailVerifiedAt === null &&
        !isPlaceholderEmail(account.email)
    );
}

/** Like `emailLinkOrigin`, but a 503 when emails cannot be sent. */
export function requireEmailLinkOrigin(req: NextRequest): string {
    const origin = emailLinkOrigin(req);
    if (!origin) throw apiError(503, 'emailNotConfigured');
    return origin;
}

/** A link token; only `id` (its hash) is stored, the token itself goes into the email. */
export type LinkToken = { token: string; id: string };

export function newLinkToken(): LinkToken {
    const token = randomBytes(32).toString('base64url');
    return { token, id: hashToken(token) };
}

/** Stored id of a token from a link. */
export const linkTokenId = (token: string) => hashToken(token);

/** A new link replaces the user's previous one of the same kind. */
async function issueToken(userId: number, kind: EmailTokenKind, link = newLinkToken()) {
    const { token } = link;

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

/** The user of a link that still works, without redeeming it. */
export async function linkOwner(token: string, kind: EmailTokenKind): Promise<number> {
    const row = await db.emailToken.findUnique({
        where: { id: hashToken(token) },
        select: { userId: true, kind: true, expiresAt: true },
    });
    if (!row || row.kind !== kind) throw badRequest('linkInvalid');
    if (row.expiresAt <= new Date()) throw badRequest('linkExpired');

    return row.userId;
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

async function sendVerificationEmail(user: Recipient, origin: string, link?: LinkToken) {
    const token = await issueToken(user.id, 'EMAIL_VERIFICATION', link);
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

/**
 * Someone signed up with an address that already has an account: its owner is
 * told so (and how to get in), instead of the form saying "email taken".
 */
export async function sendAccountExistsEmail(userId: number, origin: string) {
    const user = await db.user.findUnique({ where: { id: userId }, select: recipientSelect });
    if (!user || isPlaceholderEmail(user.email)) return;

    const t = await emailTranslator(user.locale);

    await sendEmail(user.email, {
        subject: t('accountExists.subject'),
        preheader: t('accountExists.preheader'),
        heading: t('accountExists.heading'),
        paragraphs: [t('greeting', { name: user.fullName }), t('accountExists.intro')],
        button: { label: t('accountExists.button'), url: `${origin}/auth/login` },
        notes: [t('accountExists.forgot'), t('accountExists.ignore')],
        linkCaption: t('linkCaption'),
        footer: t('footer'),
    });
}

/**
 * A sign-up answered "check your inbox" could not create the account after all
 * (its username was taken a moment before): its author is told to try again.
 */
export async function sendSignupFailedEmail(
    to: { email: string; username: string; locale: string },
    origin: string,
) {
    const t = await emailTranslator(to.locale);

    await sendEmail(to.email, {
        subject: t('signupFailed.subject'),
        preheader: t('signupFailed.preheader'),
        heading: t('signupFailed.heading'),
        paragraphs: [t('signupFailed.intro', { username: to.username })],
        button: { label: t('signupFailed.button'), url: `${origin}/auth/register` },
        notes: [t('signupFailed.ignore')],
        linkCaption: t('linkCaption'),
        footer: t('signupFailed.footer'),
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

/**
 * Emails a confirmation link (`link`, when the caller already handed its id to
 * the browser, see `setConfirmCookie`). Returns `false` when there is nothing
 * to confirm (already confirmed or no real address).
 */
export async function requestEmailConfirmation(userId: number, origin: string, link?: LinkToken) {
    const user = await db.user.findUnique({ where: { id: userId }, select: recipientSelect });
    if (!user || user.emailVerifiedAt || isPlaceholderEmail(user.email)) return false;

    await sendVerificationEmail(user, origin, link);
    return true;
}

/** The user's newest confirmation link that still works (its id and when it was sent). */
export function newestConfirmationLink(userId: number) {
    return db.emailToken.findFirst({
        where: { userId, kind: 'EMAIL_VERIFICATION', expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true },
    });
}

/*
 * The browser that signed up (or typed the right password) keeps the id of the
 * confirmation link it caused. Opening the link there signs in; opened anywhere
 * else it only confirms the address and the password is still needed. So a
 * confirmation mail someone did not ask for (an account made by a stranger with
 * their address) never signs them into that stranger's account.
 */
const CONFIRM_COOKIE = 'email_confirm';
const CONFIRM_COOKIE_PATH = '/api/auth/email/verify';

export function setConfirmCookie(res: NextResponse, linkId: string) {
    res.cookies.set({
        name: CONFIRM_COOKIE,
        value: linkId,
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: CONFIRM_COOKIE_PATH,
        maxAge: TTL_MS.EMAIL_VERIFICATION / 1000,
    });
}

export function clearConfirmCookie(res: NextResponse) {
    res.cookies.delete({ name: CONFIRM_COOKIE, path: CONFIRM_COOKIE_PATH });
}

/** Whether this browser is the one the confirmation link `token` was sent for. */
export function isConfirmingBrowser(req: NextRequest, token: string) {
    const expected = req.cookies.get(CONFIRM_COOKIE)?.value;
    return Boolean(expected) && expected === linkTokenId(token);
}

/**
 * Confirms the address. Sessions opened before it was proven are ended: one of
 * them could belong to whoever signed up with someone else's address, and it
 * would start working once the real owner confirms. The link signs in afresh.
 */
export async function confirmEmail(token: string) {
    const userId = await consumeToken(token, 'EMAIL_VERIFICATION');

    const { count } = await db.user.updateMany({
        where: { id: userId, emailVerifiedAt: null },
        data: { emailVerifiedAt: new Date() },
    });

    if (count > 0) {
        // Staff impersonating the account are not its holder: their session stays.
        await db.session.deleteMany({ where: { userId, impersonatorUserId: null } });
        await dropRevokedConnections([userId]);
    }

    return userId;
}

/** `catch` handler for emails sent after the response: the requester never sees the failure. */
export function logEmailFailure(label: string) {
    return (error: unknown) => console.error(`[email] ${label}`, error);
}
