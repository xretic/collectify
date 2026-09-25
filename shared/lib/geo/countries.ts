import { countries, type TCountryCode } from 'countries-list';

/** ISO 3166-1 alpha-2 code of a country or territory. */
export type CountryCode = TCountryCode;

export const COUNTRY_CODES = Object.keys(countries) as CountryCode[];

export const isCountryCode = (value: string): value is CountryCode =>
    Object.hasOwn(countries, value);

export function countryName(code: string): string {
    return isCountryCode(code) ? countries[code].name : code;
}

/** Codes with English names, sorted by name (for pickers). */
export const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort(
    (a, b) => a.name.localeCompare(b.name),
);
