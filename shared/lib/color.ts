/** Small sRGB helpers for the theme editor. Colors are `#rrggbb` strings. */

type Rgb = [number, number, number];

const HEX = /^#[0-9a-f]{6}$/i;

export const isHexColor = (value: unknown): value is string =>
    typeof value === 'string' && HEX.test(value);

/** Accepts `abc`, `#abc`, `aabbcc` or `#aabbcc`; returns lowercase `#aabbcc` or null. */
export function normalizeHex(value: string): string | null {
    let hex = value.trim().replace(/^#/, '').toLowerCase();
    if (/^[0-9a-f]{3}$/.test(hex)) hex = [...hex].map((c) => c + c).join('');
    return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null;
}

const toRgb = (hex: string): Rgb => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
];

const toHex = (rgb: Rgb) =>
    `#${rgb
        .map((channel) =>
            Math.round(Math.min(255, Math.max(0, channel)))
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;

/** `amount` 0 keeps `from`, 1 gives `to`. */
export function mix(from: string, to: string, amount: number): string {
    const a = toRgb(from);
    const b = toRgb(to);
    return toHex([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * amount) as Rgb);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
    const [r, g, b] = toRgb(hex).map((channel) => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}

export const isDark = (hex: string) => luminance(hex) < 0.18;

/**
 * Moves `color` toward black or white (whichever the backgrounds allow) by the
 * smallest step that reaches `ratio` against every background. Returns the
 * extreme when even that falls short.
 */
export function ensureContrast(color: string, backgrounds: string[], ratio: number): string {
    const worst = (candidate: string) =>
        Math.min(...backgrounds.map((background) => contrast(candidate, background)));
    if (worst(color) >= ratio) return color;

    const target = worst('#000000') >= worst('#ffffff') ? '#000000' : '#ffffff';
    let low = 0;
    let high = 1;
    for (let i = 0; i < 16; i++) {
        const middle = (low + high) / 2;
        if (worst(mix(color, target, middle)) >= ratio) high = middle;
        else low = middle;
    }
    return mix(color, target, high);
}

/** h 0-360, s and l 0-1. */
export function hsl(h: number, s: number, l: number): string {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
