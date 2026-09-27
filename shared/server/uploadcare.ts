import 'server-only';
import { serverEnv } from './env';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Uploadcare's batch delete takes at most 100 files per request. */
const BATCH = 100;

/** Uploadcare file ids in `https://<prefix>.ucarecd.net/<uuid>/...` (or the legacy ucarecdn.com) URLs. */
export function uploadcareIds(urls: (string | null | undefined)[]): string[] {
    const ids = new Set<string>();

    for (const value of urls) {
        if (!value) continue;
        try {
            const url = new URL(value);
            if (!/(^|\.)ucarecd\.net$|(^|\.)ucarecdn\.com$/.test(url.hostname)) continue;
            const id = url.pathname.split('/')[1];
            if (id && UUID.test(id)) ids.add(id);
        } catch {
            // Not a URL.
        }
    }

    return [...ids];
}

export const canDeleteUploads = () =>
    Boolean(serverEnv.UPLOADCARE_SECRET_KEY && process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY);

/** Permanently removes files from Uploadcare storage (REST API, needs the secret key). */
export async function deleteUploadcareFiles(ids: string[]) {
    const publicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY?.trim();
    const secretKey = serverEnv.UPLOADCARE_SECRET_KEY;
    if (!publicKey || !secretKey || ids.length === 0) return;

    for (let start = 0; start < ids.length; start += BATCH) {
        const res = await fetch('https://api.uploadcare.com/files/storage/', {
            method: 'DELETE',
            headers: {
                Authorization: `Uploadcare.Simple ${publicKey}:${secretKey}`,
                Accept: 'application/vnd.uploadcare-v0.7+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ids.slice(start, start + BATCH)),
        });

        if (!res.ok) throw new Error(`Uploadcare responded ${res.status}: ${await res.text()}`);
    }
}
