'use client';

import { useTranslations } from 'next-intl';
import { REVIEW_VERDICTS, type ReportVerdict } from '@/entities/report/model/types';
import { SANCTION_SCOPES, type SanctionScope } from '@/entities/sanction/model/types';

const DIRECT_ACTIONS = {
    'delete-user': 'deleteUser',
    'delete-comment': 'deleteComment',
    'delete-collection': 'deleteCollection',
    'impersonate-user': 'impersonateUser',
    'stop-impersonation': 'stopImpersonation',
} as const;

function humanize(value = '') {
    return value
        .split(/[-_:]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

const isScope = (value: string): value is SanctionScope =>
    SANCTION_SCOPES.includes(value as SanctionScope);
const isVerdict = (value: string): value is ReportVerdict =>
    value === 'PENDING' || REVIEW_VERDICTS.includes(value as never);
const isDirect = (value: string): value is keyof typeof DIRECT_ACTIONS => value in DIRECT_ACTIONS;

/** "grant:Moderator" → "Granted Moderator", "sanction:COMMENTS" → "Applied: Comments mute"… */
export function useFormatAuditAction() {
    const t = useTranslations('management.audit.actions');
    const tRoles = useTranslations('roles');
    const tSanctions = useTranslations('sanctions');
    const tReports = useTranslations('reports');

    const role = (value: string) =>
        value === 'Admin' || value === 'Moderator' || value === 'Verified'
            ? tRoles(value)
            : humanize(value);
    const scope = (value: string) =>
        isScope(value) ? tSanctions(`scopes.${value}`) : humanize(value);

    return (action: string) => {
        const [type, value = ''] = action.split(':');

        switch (type) {
            case 'grant':
                return t('grant', { role: role(value) });
            case 'revoke':
                return t('revoke', { role: role(value) });
            case 'sanction':
                return t('sanction', { scope: scope(value) });
            case 'revoke-sanction':
                return t('revokeSanction', { scope: scope(value) });
            case 'report':
                return t('report', {
                    verdict: isVerdict(value) ? tReports(`verdicts.${value}`) : humanize(value),
                });
            default:
                return isDirect(action) ? t(DIRECT_ACTIONS[action]) : humanize(action);
        }
    };
}
