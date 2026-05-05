export async function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.') {
    if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: Response }).response;

        if (response) {
            try {
                const body = (await response.json()) as { message?: string };
                if (body.message) return body.message;
            } catch {
                return fallback;
            }
        }
    }

    return fallback;
}
