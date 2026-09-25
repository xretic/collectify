'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type ManagementTab = 'users' | 'reports' | 'categories';

const TABS: readonly ManagementTab[] = ['users', 'reports', 'categories'];

const positiveInt = (value: string | null) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
};

/** Tab and selection live in the URL so views are linkable (e.g. from a profile's "Manage"). */
export function useManagementUrl() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const tabParam = searchParams.get('tab') as ManagementTab | null;
    const tab: ManagementTab = tabParam && TABS.includes(tabParam) ? tabParam : 'users';
    const userId = positiveInt(searchParams.get('userId'));
    const reportId = positiveInt(searchParams.get('reportId'));
    const categoryParam = searchParams.get('categoryId');
    const categoryId: number | 'new' | null =
        categoryParam === 'new' ? 'new' : positiveInt(categoryParam);

    const update = useCallback(
        (changes: Record<string, string | number | null>) => {
            const next = new URLSearchParams(searchParams.toString());

            for (const [key, value] of Object.entries(changes)) {
                if (value === null || value === '') next.delete(key);
                else next.set(key, String(value));
            }

            router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    return {
        tab,
        userId,
        reportId,
        categoryId,
        setTab: (value: ManagementTab) => update({ tab: value === 'users' ? null : value }),
        selectUser: (id: number | null) => update({ userId: id }),
        selectReport: (id: number | null) => update({ reportId: id }),
        selectCategory: (id: number | 'new' | null) => update({ categoryId: id }),
    };
}
