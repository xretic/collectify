import { HTTPError } from 'ky';
import { translate } from '@/shared/i18n/translator';

/**
 * Human-readable message from an API error (`{ message }` body, already in the
 * viewer's language) or a network failure.
 */
export async function getApiErrorMessage(error: unknown, fallback?: string): Promise<string> {
    const fallbackMessage = fallback ?? translate('errors.generic');

    if (error instanceof HTTPError) {
        try {
            const body = (await error.response.clone().json()) as { message?: unknown };
            if (typeof body.message === 'string' && body.message) return body.message;
        } catch {
            // Body was not JSON.
        }

        return fallbackMessage;
    }

    if (error instanceof TypeError) return translate('errors.network');

    return fallbackMessage;
}

/** The stable `code` of an API error (e.g. `emailNotVerified`), or `null`. */
export async function getApiErrorCode(error: unknown): Promise<string | null> {
    if (!(error instanceof HTTPError)) return null;

    try {
        const body = (await error.response.clone().json()) as { code?: unknown };
        return typeof body.code === 'string' ? body.code : null;
    } catch {
        return null;
    }
}
