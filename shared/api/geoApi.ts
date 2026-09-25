import { api } from '@/shared/api/api';
import type { CityOption } from '@/shared/lib/geo/cities';

export const geoQueryKeys = {
    cities: (query: string, country: string | null) => ['geo', 'cities', country, query] as const,
};

export const geoApi = {
    async searchCities(query: string, country: string | null) {
        return (
            await api
                .get('geo/cities', {
                    searchParams: country ? { q: query, country } : { q: query },
                })
                .json<{ cities: CityOption[] }>()
        ).cities;
    },
};
