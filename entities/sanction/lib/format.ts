'use client';

import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';
import type { SanctionScope } from '../model/types';

/** "Comments mute · until Sep 30, 2026, 14:00" / "Account ban · permanent". */
export function useFormatSanction() {
    const t = useTranslations('sanctions');
    const format = useFormatters();

    return (sanction: { scope: SanctionScope; expiresAt: string | null }) =>
        sanction.expiresAt
            ? t('until', {
                  scope: t(`scopes.${sanction.scope}`),
                  date: format.dateTime(sanction.expiresAt),
              })
            : t('permanentScope', { scope: t(`scopes.${sanction.scope}`) });
}
