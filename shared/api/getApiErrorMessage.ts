import { HTTPError } from 'ky';

const FALLBACK = 'Something went wrong. Please try again.';

/** Human-readable message from an API error (`{ message }` body) or a network failure. */
export async function getApiErrorMessage(error: unknown, fallback = FALLBACK): Promise<string> {
    if (error instanceof HTTPError) {
        try {
            const body = (await error.response.clone().json()) as { message?: unknown };
            if (typeof body.message === 'string' && body.message) return body.message;
        } catch {
            // Body was not JSON.
        }

        return fallback;
    }

    if (error instanceof TypeError) return 'Network error. Check your connection.';

    return fallback;
}
