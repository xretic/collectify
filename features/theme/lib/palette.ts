import type { CSSProperties } from 'react';
import {
    CUSTOM_THEME_NAME_MAX_LENGTH,
    THEME_TOKENS,
    type ColorScheme,
    type ThemeColors,
    type ThemeToken,
} from '@/shared/config/themes';
import { contrast, ensureContrast, hsl, luminance, mix, normalizeHex } from '@/shared/lib/color';

/** The three colors a theme is built from; everything else can be derived. */
export const MAIN_TOKENS = ['bg-color', 'text-color', 'accent'] as const;
export type MainToken = (typeof MAIN_TOKENS)[number];

export const isMainToken = (token: ThemeToken): token is MainToken =>
    (MAIN_TOKENS as readonly ThemeToken[]).includes(token);

/** Dark when the background is darker than the text. */
export const schemeOf = (colors: ThemeColors): ColorScheme =>
    luminance(colors['bg-color']) < luminance(colors['text-color']) ? 'dark' : 'light';

const WHITE = '#ffffff';
const BASE_DANGER: Record<ColorScheme, string> = { light: '#d22c2c', dark: '#f48582' };
const BASE_FAVORITE: Record<ColorScheme, string> = { light: '#f5a623', dark: '#ffc247' };

/** Text on a filled color: whichever of white, background or text reads best. */
function onFill(fill: string, colors: ThemeColors) {
    const [best] = [WHITE, colors['bg-color'], colors['text-color']].sort(
        (a, b) => contrast(b, fill) - contrast(a, fill),
    );
    return ensureContrast(best, [fill], 4.5);
}

type Rule = { from: ThemeToken[]; derive: (colors: ThemeColors) => string };

/**
 * How each secondary color follows the others, in dependency order. Danger
 * and favorites keep their hue and only get more readable when needed.
 */
const RULES: Partial<Record<ThemeToken, Rule>> = {
    'container-color': {
        from: ['bg-color', 'text-color'],
        derive: (c) => {
            if (schemeOf(c) === 'dark') return mix(c['bg-color'], c['text-color'], 0.06);
            const lighter = mix(c['bg-color'], WHITE, 0.7);
            return contrast(lighter, c['bg-color']) < 1.04
                ? mix(c['bg-color'], c['text-color'], 0.035)
                : lighter;
        },
    },
    'border-color': {
        from: ['container-color', 'text-color'],
        derive: (c) =>
            mix(c['container-color'], c['text-color'], schemeOf(c) === 'dark' ? 0.2 : 0.17),
    },
    'soft-text': {
        from: ['bg-color', 'container-color', 'text-color'],
        derive: (c) =>
            ensureContrast(
                mix(c['text-color'], c['container-color'], 0.3),
                [c['container-color'], c['bg-color']],
                4.5,
            ),
    },
    'muted-icon': {
        from: ['container-color', 'text-color'],
        derive: (c) =>
            ensureContrast(
                mix(c['text-color'], c['container-color'], 0.45),
                [c['container-color']],
                3,
            ),
    },
    'on-accent': {
        from: ['bg-color', 'text-color', 'accent'],
        derive: (c) => onFill(c.accent, c),
    },
    danger: {
        from: ['bg-color', 'container-color'],
        derive: (c) => ensureContrast(c.danger, [c['container-color'], c['bg-color']], 4.5),
    },
    'on-danger': {
        from: ['bg-color', 'text-color', 'danger'],
        derive: (c) => onFill(c.danger, c),
    },
};

export const isDerivable = (token: ThemeToken) => token in RULES;

/** What `token` would be if it followed the other colors. */
export const autoColor = (token: ThemeToken, colors: ThemeColors) =>
    RULES[token]?.derive(colors) ?? colors[token];

/**
 * Recomputes the tokens that depend on `changed` (directly or through another
 * derived token), except the ones the user set by hand.
 */
export function rederive(
    colors: ThemeColors,
    changed: ThemeToken[],
    manual: ThemeToken[],
): ThemeColors {
    const next = { ...colors };
    const dirty = new Set(changed);

    for (const token of THEME_TOKENS) {
        const rule = RULES[token];
        if (!rule || manual.includes(token) || !rule.from.some((from) => dirty.has(from))) continue;
        next[token] = rule.derive(next);
        dirty.add(token);
    }
    return next;
}

/** A full theme from its three main colors. */
export function buildColors(main: Pick<ThemeColors, MainToken>): ThemeColors {
    const scheme = luminance(main['bg-color']) < luminance(main['text-color']) ? 'dark' : 'light';
    const seed = {
        ...main,
        danger: BASE_DANGER[scheme],
        favorite: BASE_FAVORITE[scheme],
    } as ThemeColors;
    return rederive(seed, [...MAIN_TOKENS], []);
}

const between = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(values: readonly T[]) => values[Math.floor(Math.random() * values.length)];

/** A random but pleasant palette: tinted neutrals plus an accent from a matching hue. */
export function randomColors(): ThemeColors {
    const hue = between(0, 360);
    const accentHue = (hue + pick([0, 30, 150, 180, 210, 330])) % 360;
    const main =
        Math.random() < 0.55
            ? {
                  'bg-color': hsl(hue, between(0.1, 0.3), between(0.1, 0.17)),
                  'text-color': hsl(hue, between(0.1, 0.3), between(0.86, 0.94)),
                  accent: hsl(accentHue, between(0.6, 0.9), between(0.62, 0.72)),
              }
            : {
                  'bg-color': hsl(hue, between(0.2, 0.45), between(0.92, 0.97)),
                  'text-color': hsl(hue, between(0.15, 0.3), between(0.14, 0.24)),
                  accent: hsl(accentHue, between(0.6, 0.9), between(0.3, 0.4)),
              };
    return fixAll(buildColors(main), []);
}

export type ContrastCheck = {
    id: 'text' | 'softText' | 'icons' | 'accent' | 'onAccent' | 'danger' | 'onDanger';
    fg: ThemeToken;
    bg: ThemeToken[];
    /** WCAG AA: 4.5 for text, 3 for icons. */
    min: number;
};

/** Ordered so fixing one never breaks an earlier one. */
export const CONTRAST_CHECKS: ContrastCheck[] = [
    { id: 'text', fg: 'text-color', bg: ['bg-color', 'container-color'], min: 4.5 },
    { id: 'softText', fg: 'soft-text', bg: ['bg-color', 'container-color'], min: 4.5 },
    { id: 'icons', fg: 'muted-icon', bg: ['container-color'], min: 3 },
    { id: 'accent', fg: 'accent', bg: ['bg-color', 'container-color'], min: 4.5 },
    { id: 'onAccent', fg: 'on-accent', bg: ['accent'], min: 4.5 },
    { id: 'danger', fg: 'danger', bg: ['container-color'], min: 4.5 },
    { id: 'onDanger', fg: 'on-danger', bg: ['danger'], min: 4.5 },
];

export const ratioOf = (check: ContrastCheck, colors: ThemeColors) =>
    Math.min(...check.bg.map((bg) => contrast(colors[check.fg], colors[bg])));

export const passes = (check: ContrastCheck, colors: ThemeColors) =>
    ratioOf(check, colors) >= check.min;

/** The smallest change to `check.fg` that makes the check pass. */
export const fixedColor = (check: ContrastCheck, colors: ThemeColors) =>
    ensureContrast(
        colors[check.fg],
        check.bg.map((bg) => colors[bg]),
        check.min,
    );

export function fixAll(colors: ThemeColors, manual: ThemeToken[]): ThemeColors {
    let next = colors;
    for (const check of CONTRAST_CHECKS) {
        if (passes(check, next)) continue;
        next = rederive({ ...next, [check.fg]: fixedColor(check, next) }, [check.fg], manual);
    }
    return next;
}

/** Inline tokens that paint an element (and its children) with `colors`. */
export const themeStyle = (colors: ThemeColors): CSSProperties =>
    ({
        ...Object.fromEntries(THEME_TOKENS.map((token) => [`--${token}`, colors[token]])),
        colorScheme: schemeOf(colors),
    }) as CSSProperties;

/** The tokens a preset theme defines, read from app/themes.css through a probe element. */
export function readThemeColors(themeId: string): ThemeColors {
    const probe = document.createElement('div');
    probe.dataset.theme = themeId;
    probe.hidden = true;
    document.body.append(probe);

    const style = getComputedStyle(probe);
    const colors = Object.fromEntries(
        THEME_TOKENS.map((token) => [
            token,
            normalizeHex(style.getPropertyValue(`--${token}`)) ?? '#808080',
        ]),
    ) as ThemeColors;

    probe.remove();
    return colors;
}

/**
 * Share code: the eleven colors as 66 hex digits, then `.` and the name.
 * Short enough for a URL and readable without a server.
 */
export const encodeTheme = (name: string, colors: ThemeColors) =>
    THEME_TOKENS.map((token) => colors[token].slice(1)).join('') + (name ? `.${name}` : '');

export function decodeTheme(code: string): { name: string; colors: ThemeColors } | null {
    const [hex, ...rest] = code.trim().split('.');
    if (!/^[0-9a-f]{66}$/i.test(hex)) return null;

    const colors = Object.fromEntries(
        THEME_TOKENS.map((token, i) => [token, `#${hex.slice(i * 6, i * 6 + 6).toLowerCase()}`]),
    ) as ThemeColors;
    return { name: rest.join('.').trim().slice(0, CUSTOM_THEME_NAME_MAX_LENGTH), colors };
}
