import 'server-only';
import { isProduction, serverEnv } from './env';

const RESEND_URL = 'https://api.resend.com/emails';
// Resend's shared test sender: delivers only to the address that owns the API key.
const FALLBACK_FROM = 'Collectify <onboarding@resend.dev>';

export type EmailContent = {
    subject: string;
    /** Hidden line most clients show next to the subject in the inbox. */
    preheader: string;
    heading: string;
    paragraphs: string[];
    button: { label: string; url: string };
    /** Small print under the button. */
    notes: string[];
    /** Caption above the raw link for clients that block the button. */
    linkCaption: string;
    footer: string;
};

const escapeHtml = (value: string) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

// Email clients ignore stylesheets, so the layout is inline-styled tables.
function renderHtml(content: EmailContent) {
    const text = (value: string) => escapeHtml(value);
    const url = escapeHtml(content.button.url);

    const paragraphs = content.paragraphs
        .map(
            (paragraph) =>
                `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#1f2937">${text(paragraph)}</p>`,
        )
        .join('');

    const notes = content.notes
        .map(
            (note) =>
                `<p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#6b7280">${text(note)}</p>`,
        )
        .join('');

    return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text(content.subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${text(content.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 8px 20px;font-size:22px;font-weight:700;color:#111827">Collectify</td></tr>
<tr><td style="background:#ffffff;border-radius:20px;padding:32px">
<h1 style="margin:0 0 20px;font-size:22px;line-height:30px;color:#111827">${text(content.heading)}</h1>
${paragraphs}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:#208fff">
<a href="${url}" style="display:inline-block;padding:12px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${text(content.button.label)}</a>
</td></tr></table>
${notes}
<p style="margin:16px 0 4px;font-size:13px;line-height:20px;color:#6b7280">${text(content.linkCaption)}</p>
<p style="margin:0;font-size:13px;line-height:20px;word-break:break-all"><a href="${url}" style="color:#208fff">${url}</a></p>
</td></tr>
<tr><td style="padding:20px 8px 0;font-size:12px;line-height:18px;color:#9ca3af">${text(content.footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function renderText(content: EmailContent) {
    return [
        content.heading,
        '',
        ...content.paragraphs,
        '',
        `${content.button.label}: ${content.button.url}`,
        '',
        ...content.notes,
        '',
        content.footer,
    ].join('\n');
}

export const isEmailConfigured = () => Boolean(serverEnv.RESEND_API_KEY);

/**
 * Sends a transactional email through Resend. Without an API key the email is
 * printed to the server log in development (so links can be followed locally)
 * and fails in production.
 */
export async function sendEmail(to: string, content: EmailContent): Promise<void> {
    const key = serverEnv.RESEND_API_KEY;

    if (!key) {
        if (isProduction) throw new Error('RESEND_API_KEY is not set; cannot send email.');
        console.info(`[email] to ${to}: ${content.subject}\n${renderText(content)}`);
        return;
    }

    const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: serverEnv.EMAIL_FROM ?? FALLBACK_FROM,
            to: [to],
            subject: content.subject,
            html: renderHtml(content),
            text: renderText(content),
        }),
    });

    if (!res.ok) {
        throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
    }
}
