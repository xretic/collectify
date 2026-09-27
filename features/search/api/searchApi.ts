import { api } from '@/shared/api/api';
import type { SearchResults } from '../model/types';

export const searchApi = {
    async search(query: string, signal?: AbortSignal) {
        return api.get('search', { searchParams: { q: query }, signal }).json<SearchResults>();
    },
};
