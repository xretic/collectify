import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { searchCities } from '@/shared/server/geo/cities';
import { CITY_MAX_LENGTH } from '@/shared/lib/constants';
import { CITY_SEARCH_LIMIT } from '@/shared/lib/geo/cities';
import { isCountryCode } from '@/shared/lib/geo/countries';

const querySchema = z.object({
    q: z.string().trim().min(1).max(CITY_MAX_LENGTH),
    country: z.string().trim().toUpperCase().refine(isCountryCode, 'Unknown country.').optional(),
});

export const GET = route(async (req) => {
    await enforceRateLimit(req, 'autocomplete');

    const { q, country } = readQuery(req, querySchema);
    const cities = await searchCities(q, country ?? null, CITY_SEARCH_LIMIT);

    return json({ cities });
});
