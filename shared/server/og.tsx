import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactNode } from 'react';
import type { ImageResponseOptions } from 'next/server';
import { fetchPublic } from './safeFetch';

/*
 * Building blocks of the share images (Open Graph / Twitter cards). They are
 * rendered by Satori, which only understands inline styles and flexbox, so
 * unlike the rest of the UI the styles live right here.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const COLORS = {
    background: '#f3f4f6',
    card: '#ffffff',
    text: '#111827',
    soft: '#6b7280',
    border: '#e5e7eb',
    accent: '#208fff',
};

/** Satori draws PNG and JPEG only. */
const DRAWABLE_TYPES = ['image/jpeg', 'image/png'] as const;
const UPLOADCARE_FILE = /^\/[0-9a-f-]{36}\/(?:-\/.+\/)?$/;

/** Uploadcare serves any upload (WebP, AVIF...) as a small JPEG on request. */
function drawableUrl(url: string) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.endsWith('.ucarecd.net') && UPLOADCARE_FILE.test(parsed.pathname)) {
            return `${url}-/preview/1000x1000/-/format/jpeg/-/quality/lighter/`;
        }
    } catch {
        // Not a URL: fetchPublic rejects it below.
    }
    return url;
}

/** A user image as a data URL Satori can draw, or `null` when it cannot be fetched safely. */
export async function loadOgImage(url: string | null | undefined): Promise<string | null> {
    if (!url) return null;

    const image = await fetchPublic(drawableUrl(url), {
        accept: DRAWABLE_TYPES,
        timeoutMs: 3000,
        maxBytes: 4 * 1024 * 1024,
    });

    return image ? `data:${image.contentType};base64,${image.body.toString('base64')}` : null;
}

/** First `limit` images that load, in order. */
export async function loadOgImages(urls: (string | null | undefined)[], limit: number) {
    const loaded = await Promise.all(urls.slice(0, limit * 2).map(loadOgImage));
    return loaded.filter((image): image is string => image !== null).slice(0, limit);
}

let fonts: Promise<NonNullable<ImageResponseOptions['fonts']>> | null = null;

// Rubik only: Satori cannot parse the substitution tables of the Google Sans file.
export function loadOgFonts() {
    fonts ??= readFile(join(process.cwd(), 'public/fonts/Rubik-Medium.ttf')).then((rubik) => [
        { name: 'Rubik', data: rubik, weight: 500, style: 'normal' },
    ]);

    return fonts;
}

/** The app icon; `square` drops the rounded corners (platforms round app icons themselves). */
export function OgLogo({ size, square = false }: { size: number; square?: boolean }) {
    return (
        <svg width={size} height={size} viewBox="0 0 251 251">
            <defs>
                <linearGradient
                    id="logo"
                    x1="-202.5"
                    y1="-31.5"
                    x2="125.5"
                    y2="251"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#39C1FB" />
                    <stop offset="1" />
                </linearGradient>
            </defs>
            <rect width="251" height="251" rx={square ? 0 : 70} fill="url(#logo)" />
            <path
                d="M105.76 135.96C105.76 143.747 107.467 150.147 110.88 155.16C114.293 160.067 119.893 162.52 127.68 162.52C130.88 162.52 134.187 162.093 137.6 161.24C141.12 160.387 145.44 158.947 150.56 156.92L156.48 173.56C150.72 176.12 145.387 177.933 140.48 179C135.68 180.067 131.04 180.6 126.56 180.6C117.6 180.6 110.08 178.68 104 174.84C98.0267 171 93.5467 165.72 90.56 159C87.5733 152.28 86.08 144.6 86.08 135.96V113.08C86.08 104.44 87.5733 96.76 90.56 90.04C93.5467 83.32 98.0267 78.0933 104 74.36C110.08 70.52 117.6 68.6 126.56 68.6C130.933 68.6 135.467 69.1333 140.16 70.2C144.853 71.16 149.973 72.8667 155.52 75.32L149.6 92.28C144.693 90.2533 140.587 88.8133 137.28 87.96C133.973 87.1067 130.773 86.68 127.68 86.68C119.893 86.68 114.293 89.1333 110.88 94.04C107.467 98.9467 105.76 105.293 105.76 113.08V135.96Z"
                fill="white"
            />
        </svg>
    );
}

function Brand() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <OgLogo size={48} />
            <span style={{ fontSize: 30, color: COLORS.text }}>Collectify</span>
        </div>
    );
}

/** Up to four images: one fills the area, more form a Pinterest-like mosaic. */
export function OgCollage({
    images,
    width,
    height,
}: {
    images: string[];
    width: number;
    height: number;
}) {
    const gap = 12;
    const radius = 24;
    const cell = (src: string, w: number, h: number) => (
        <img
            key={src.slice(-32)}
            src={src}
            alt=""
            width={w}
            height={h}
            style={{ width: w, height: h, objectFit: 'cover', borderRadius: radius }}
        />
    );

    if (images.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width,
                    height,
                    borderRadius: radius,
                    backgroundImage: 'linear-gradient(135deg, #39c1fb, #208fff)',
                }}
            >
                <OgLogo size={160} />
            </div>
        );
    }

    if (images.length < 3) return cell(images[0], width, height);

    const half = (width - gap) / 2;

    if (images.length === 3) {
        return (
            <div style={{ display: 'flex', gap }}>
                {cell(images[0], half, height)}
                <div style={{ display: 'flex', flexDirection: 'column', gap }}>
                    {cell(images[1], half, (height - gap) / 2)}
                    {cell(images[2], half, (height - gap) / 2)}
                </div>
            </div>
        );
    }

    const rowHeight = (height - gap) / 2;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            <div style={{ display: 'flex', gap }}>
                {cell(images[0], half, rowHeight)}
                {cell(images[1], half, rowHeight)}
            </div>
            <div style={{ display: 'flex', gap }}>
                {cell(images[2], half, rowHeight)}
                {cell(images[3], half, rowHeight)}
            </div>
        </div>
    );
}

type OgCardProps = {
    /** Small pill above the title (category, "Profile"). */
    eyebrow?: string;
    title: string;
    /** Author / handle row under the title. */
    byline?: ReactNode;
    /** Counters at the bottom ("13 items · 4.9K likes"). */
    stats: string[];
    images: string[];
};

/** Text on the left, a collage on the right, the brand in the corner. */
export function OgCard({ eyebrow, title, byline, stats, images }: OgCardProps) {
    const padding = 48;
    const collageWidth = 520;

    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                gap: 44,
                padding,
                background: COLORS.background,
                fontFamily: 'Rubik',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {eyebrow && (
                        <div style={{ display: 'flex' }}>
                            <span
                                style={{
                                    padding: '8px 18px',
                                    fontSize: 22,
                                    color: COLORS.text,
                                    background: COLORS.card,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: 999,
                                }}
                            >
                                {eyebrow}
                            </span>
                        </div>
                    )}
                    <div
                        style={{
                            display: 'block',
                            fontSize: title.length > 40 ? 52 : 62,
                            lineHeight: 1.12,
                            color: COLORS.text,
                            lineClamp: 3,
                        }}
                    >
                        {title}
                    </div>
                    {byline}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    <span style={{ fontSize: 26, color: COLORS.soft }}>{stats.join('  ·  ')}</span>
                    <Brand />
                </div>
            </div>

            <OgCollage images={images} width={collageWidth} height={630 - padding * 2} />
        </div>
    );
}

/** Avatar with a name and / or @handle under an OG title. */
export function OgByline({
    avatar,
    name,
    username,
}: {
    avatar: string | null;
    /** Left out when the title already is the name (profiles). */
    name?: string;
    username: string;
}) {
    const initial = (name ?? username).slice(0, 1).toUpperCase();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {avatar ? (
                <img
                    src={avatar}
                    alt=""
                    width={56}
                    height={56}
                    style={{ width: 56, height: 56, borderRadius: 999, objectFit: 'cover' }}
                />
            ) : (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 999,
                        fontSize: 26,
                        color: '#ffffff',
                        background: COLORS.accent,
                    }}
                >
                    {initial}
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {name && <span style={{ fontSize: 28, color: COLORS.text }}>{name}</span>}
                <span style={{ fontSize: name ? 22 : 28, color: COLORS.soft }}>@{username}</span>
            </div>
        </div>
    );
}
