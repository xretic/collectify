import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_REDIRECTS = 3;

function isPrivateIPv4(address: string) {
    const [a, b] = address.split('.').map(Number);

    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && (b === 0 || b === 168)) ||
        (a === 198 && (b === 18 || b === 19)) ||
        a >= 224
    );
}

function isPrivateAddress(address: string) {
    if (isIP(address) === 4) return isPrivateIPv4(address);

    const ip = address.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip);
    if (mapped) return isPrivateIPv4(mapped[1]);

    return (
        ip === '::' ||
        ip === '::1' ||
        ip.startsWith('::ffff:') ||
        /^f[cd]/.test(ip) ||
        /^fe[89ab]/.test(ip)
    );
}

/** Only plain http(s) on default ports, to hosts that resolve to public addresses. */
async function isPublicUrl(url: URL) {
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (url.username || url.password || url.port) return false;

    const host = url.hostname.replace(/^\[|\]$/g, '');

    try {
        const addresses = isIP(host)
            ? [{ address: host }]
            : await lookup(host, { all: true, verbatim: true });
        return addresses.length > 0 && addresses.every(({ address }) => !isPrivateAddress(address));
    } catch {
        return false;
    }
}

async function readLimited(res: Response, maxBytes: number): Promise<Buffer | null> {
    if (Number(res.headers.get('content-length') ?? 0) > maxBytes) return null;
    if (!res.body) return null;

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        size += value.byteLength;
        if (size > maxBytes) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }

    return Buffer.concat(chunks);
}

export type FetchedResource = { body: Buffer; contentType: string; url: string };

type FetchPublicOptions = {
    timeoutMs?: number;
    maxBytes?: number;
    /** Accepted media types (without parameters); anything else resolves to `null`. */
    accept: readonly string[];
};

/**
 * GETs a user-supplied URL from the server without letting it reach the
 * internal network (SSRF): every hop, redirects included, must resolve to a
 * public address. Resolves to `null` on any failure, timeout or oversize body.
 */
export async function fetchPublic(
    input: string,
    { timeoutMs = 4000, maxBytes = 5 * 1024 * 1024, accept }: FetchPublicOptions,
): Promise<FetchedResource | null> {
    let url: URL;

    try {
        url = new URL(input);
    } catch {
        return null;
    }

    const signal = AbortSignal.timeout(timeoutMs);

    try {
        for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
            if (!(await isPublicUrl(url))) return null;

            const res = await fetch(url, {
                redirect: 'manual',
                signal,
                headers: { 'User-Agent': 'CollectifyBot/1.0 (+link previews)' },
            });

            const location = res.headers.get('location');
            if (res.status >= 300 && res.status < 400 && location) {
                url = new URL(location, url);
                continue;
            }

            if (!res.ok) return null;

            const contentType = (res.headers.get('content-type') ?? '')
                .split(';')[0]
                .trim()
                .toLowerCase();
            if (!accept.includes(contentType)) return null;

            const body = await readLimited(res, maxBytes);
            return body ? { body, contentType, url: url.toString() } : null;
        }
    } catch {
        return null;
    }

    return null;
}
