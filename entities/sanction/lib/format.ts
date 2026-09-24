import { formatDateTime } from '@/shared/lib/format/date';
import { SANCTION_SCOPE_LABELS, type SanctionScope } from '../model/types';

export function formatSanction(sanction: { scope: SanctionScope; expiresAt: string | null }) {
    const label = SANCTION_SCOPE_LABELS[sanction.scope];
    return sanction.expiresAt
        ? `${label} · until ${formatDateTime(sanction.expiresAt)}`
        : `${label} · permanent`;
}
