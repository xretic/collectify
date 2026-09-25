import { countries, type TCountryCode } from 'countries-list';

/** ISO 3166-1 alpha-2 code of a country or territory. */
export type CountryCode = TCountryCode;

export const COUNTRY_CODES = Object.keys(countries) as CountryCode[];

export const isCountryCode = (value: string): value is CountryCode =>
    Object.hasOwn(countries, value);

const displayNames = new Map<string, Intl.DisplayNames>();

/** Country name in the UI language ("Germany", "Deutschland", "Німеччина"). */
export function countryName(code: string, locale = 'en'): string {
    if (!isCountryCode(code)) return code;

    let names = displayNames.get(locale);
    if (!names) {
        names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' });
        displayNames.set(locale, names);
    }

    return names.of(code) ?? countries[code].name;
}

const optionsByLocale = new Map<string, { code: CountryCode; name: string }[]>();

/** Every country with its localized name, sorted by that name (for pickers). */
export function countryOptions(locale: string) {
    let options = optionsByLocale.get(locale);

    if (!options) {
        const collator = new Intl.Collator(locale);
        options = COUNTRY_CODES.map((code) => ({ code, name: countryName(code, locale) })).sort(
            (a, b) => collator.compare(a.name, b.name),
        );
        optionsByLocale.set(locale, options);
    }

    return options;
}
