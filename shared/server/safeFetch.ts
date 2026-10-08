import 'server-only';
import { lookup } from 'node:dns/promises';
import http, { type IncomingMessage } from 'node:http';
import https from 'node:https';
import { isIP, type LookupFunction } from 'node:net';

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
        // NAT64 and 6to4 can embed any IPv4 address, internal ones included.
        ip.startsWith('64:ff9b:') ||
        ip.startsWith('2002:') ||
        /^f[cd]/.test(ip) ||
        /^fe[89ab]/.test(ip)
    );
}

/**
 * DNS lookup used for the connection itself: the addresses checked here are the
 * ones connected to, so a name that re-resolves to an internal address between
 * a check and the request (DNS rebinding) cannot slip through.
 */
const publicLookup: LookupFunction = (hostname, options, callback) => {
    lookup(hostname, { all: true, verbatim: true }).then(
        (addresses) => {
            if (
                addresses.length === 0 ||
                addresses.some(({ address }) => isPrivateAddress(address))
            ) {
                callback(new Error(`Blocked address for ${hostname}`), '', 0);
                return;
            }
            if (options.all) callback(null, addresses);
            else callback(null, addresses[0].address, addresses[0].family);
        },
        (error: NodeJS.ErrnoException) => callback(error, '', 0),
    );
};

/** Only plain http(s) on default ports; IP literals (never looked up) must be public. */
function isAllowedUrl(url: URL) {
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (url.username || url.password || url.port) return false;

    const host = url.hostname.replace(/^\[|\]$/g, '');
    return !isIP(host) || !isPrivateAddress(host);
}

function get(url: URL, signal: AbortSignal): Promise<IncomingMessage> {
    const request = url.protocol === 'https:' ? https.request : http.request;

    return new Promise((resolve, reject) => {
        const req = request(
            url,
            {
                method: 'GET',
                signal,
                agent: false,
                lookup: publicLookup,
                headers: { 'User-Agent': 'CollectifyBot/1.0 (+link previews)' },
            },
            resolve,
        );
        req.on('error', reject);
        req.end();
    });
}

async function readLimited(res: IncomingMessage, maxBytes: number): Promise<Buffer | null> {
    if (Number(res.headers['content-length'] ?? 0) > maxBytes) {
        res.destroy();
        return null;
    }

    const chunks: Buffer[] = [];
    let size = 0;

    for await (const chunk of res as AsyncIterable<Buffer>) {
        size += chunk.byteLength;
        if (size > maxBytes) {
            res.destroy();
            return null;
        }
        chunks.push(chunk);
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
 * internal network (SSRF): every hop, redirects included, connects only to
 * public addresses. Resolves to `null` on any failure, timeout or oversize body.
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
            if (!isAllowedUrl(url)) return null;

            const res = await get(url, signal);
            const status = res.statusCode ?? 0;
            const location = res.headers.location;

            if (status >= 300 && status < 400 && location) {
                res.destroy();
                url = new URL(location, url);
                continue;
            }

            const contentType = (res.headers['content-type'] ?? '')
                .split(';')[0]
                .trim()
                .toLowerCase();

            if (status < 200 || status >= 300 || !accept.includes(contentType)) {
                res.destroy();
                return null;
            }

            const body = await readLimited(res, maxBytes);
            return body ? { body, contentType, url: url.toString() } : null;
        }
    } catch {
        return null;
    }

    return null;
}
