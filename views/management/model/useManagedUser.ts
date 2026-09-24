'use client';

import { useQuery } from '@tanstack/react-query';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';

/** One managed user; shared (deduplicated) by the user panel and the audit panel. */
export function useManagedUser(userId: number) {
    const query = useQuery({
        queryKey: managementQueryKeys.users('', userId),
        queryFn: () => managementApi.users({ query: '', page: 0, userId }),
    });

    return { ...query, user: query.data?.data[0] ?? null };
}
