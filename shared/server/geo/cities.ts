import 'server-only';
import type { CityOption } from '@/shared/lib/geo/cities';
import { isCountryCode } from '@/shared/lib/geo/countries';
import { citySchema } from '@/shared/lib/validation/schemas';

type IndexedCity = CityOption & {
    key: string;
    /** Position in population order (0 = most populous). */
    rank: number;
};

/** A searchable token: the whole key, or the part after a space / hyphen in it. */
type Token = { token: string; city: IndexedCity; whole: boolean };

type CityIndex = {
    /** Normalized name → cities with that name, most populous first. */
    byKey: Map<string, IndexedCity[]>;
    /** Tokens sorted by code unit, globally and per country, for prefix range lookups. */
    tokens: Token[];
    tokensByCountry: Map<string, Token[]>;
};

/** Case-, diacritics- and apostrophe-insensitive form used for matching. */
export const normalizeCityName = (value: string) =>
    value
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[‘’ʼ`]/g, "'")
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

let indexPromise: Promise<CityIndex> | null = null;

const byToken = (a: Token, b: Token) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0);

function tokensOf(city: IndexedCity): Token[] {
    const tokens: Token[] = [{ token: city.key, city, whole: true }];

    for (let i = 1; i < city.key.length; i++) {
        const before = city.key[i - 1];
        if (before === ' ' || before === '-') {
            tokens.push({ token: city.key.slice(i), city, whole: false });
        }
    }

    return tokens;
}

/**
 * Loads ~135k GeoNames cities (population ≥ 1000) once per process, one entry
 * per name within a country, and indexes their name tokens so a search reads
 * only the matching range instead of scanning every city.
 */
function loadIndex() {
    indexPromise ??= import('all-the-cities').then(({ default: cities }) => {
        const byKey = new Map<string, IndexedCity[]>();
        const tokens: Token[] = [];
        const tokensByCountry = new Map<string, Token[]>();
        const seen = new Set<string>();
        let rank = 0;

        for (const city of [...cities].sort((a, b) => b.population - a.population)) {
            if (!isCountryCode(city.country) || !citySchema.safeParse(city.name).success) continue;

            const key = normalizeCityName(city.name);
            const id = `${city.country}:${key}`;
            if (seen.has(id)) continue;
            seen.add(id);

            const entry: IndexedCity = {
                name: city.name,
                country: city.country,
                key,
                rank: rank++,
            };

            const sameName = byKey.get(key);
            if (sameName) sameName.push(entry);
            else byKey.set(key, [entry]);

            const cityTokens = tokensOf(entry);
            tokens.push(...cityTokens);

            const countryTokens = tokensByCountry.get(city.country);
            if (countryTokens) countryTokens.push(...cityTokens);
            else tokensByCountry.set(city.country, [...cityTokens]);
        }

        tokens.sort(byToken);
        for (const list of tokensByCountry.values()) list.sort(byToken);

        return { byKey, tokens, tokensByCountry };
    });

    return indexPromise;
}

/** First index whose token is not below `query`. */
function lowerBound(tokens: Token[], query: string) {
    let lo = 0;
    let hi = tokens.length;

    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (tokens[mid].token < query) lo = mid + 1;
        else hi = mid;
    }

    return lo;
}

/** Keeps `list` as the `limit` most populous cities seen so far (sorted, unique). */
function keepTop(list: IndexedCity[], city: IndexedCity, limit: number) {
    if (list.length >= limit && city.rank >= list[list.length - 1].rank) return;
    if (list.includes(city)) return;

    let at = list.length;
    while (at > 0 && list[at - 1].rank > city.rank) at--;
    list.splice(at, 0, city);
    if (list.length > limit) list.pop();
}

/**
 * The known city named exactly `name` (after normalization), in `country` or,
 * without one, the most populous such city in the world.
 */
export async function findCity(name: string, country: string | null): Promise<CityOption | null> {
    const key = normalizeCityName(name);
    if (!key) return null;

    const { byKey } = await loadIndex();
    const candidates = byKey.get(key) ?? [];
    const city = country ? candidates.find((entry) => entry.country === country) : candidates[0];

    return city ? { name: city.name, country: city.country } : null;
}

/**
 * Cities whose name (or one of its words) starts with `query`: exact matches
 * first, then name prefixes, then word prefixes, each by population.
 */
export async function searchCities(
    query: string,
    country: string | null,
    limit: number,
): Promise<CityOption[]> {
    const q = normalizeCityName(query);
    if (!q) return [];

    const { tokens, tokensByCountry } = await loadIndex();
    const pool = country ? (tokensByCountry.get(country) ?? []) : tokens;

    const exact: IndexedCity[] = [];
    const prefix: IndexedCity[] = [];
    const word: IndexedCity[] = [];

    for (let i = lowerBound(pool, q); i < pool.length && pool[i].token.startsWith(q); i++) {
        const { city, whole } = pool[i];

        if (whole) keepTop(city.key === q ? exact : prefix, city, limit);
        // A city whose whole name matches is listed as exact / prefix already.
        else if (!city.key.startsWith(q)) keepTop(word, city, limit);
    }

    return [...exact, ...prefix, ...word]
        .slice(0, limit)
        .map(({ name, country: code }) => ({ name, country: code }));
}
