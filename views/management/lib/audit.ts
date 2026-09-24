import { REPORT_VERDICT_LABELS, type ReportVerdict } from '@/entities/report/model/types';
import { SANCTION_SCOPE_LABELS, type SanctionScope } from '@/entities/sanction/model/types';

const DIRECT_ACTIONS: Record<string, string> = {
    'delete-user': 'Deleted user account',
    'delete-comment': 'Deleted comment',
    'delete-collection': 'Deleted collection',
    'impersonate-user': 'Signed in as user',
    'stop-impersonation': 'Stopped impersonation',
};

function humanize(value = '') {
    return value
        .split(/[-_:]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

export function formatAuditAction(action: string) {
    const [type, value = ''] = action.split(':');

    switch (type) {
        case 'grant':
            return `Granted ${value.toLowerCase()}`;
        case 'revoke':
            return `Revoked ${value.toLowerCase()}`;
        case 'sanction':
            return `Applied ${(SANCTION_SCOPE_LABELS[value as SanctionScope] ?? humanize(value)).toLowerCase()}`;
        case 'revoke-sanction':
            return `Lifted ${(SANCTION_SCOPE_LABELS[value as SanctionScope] ?? humanize(value)).toLowerCase()}`;
        case 'report':
            return `Closed report: ${REPORT_VERDICT_LABELS[value as ReportVerdict] ?? humanize(value)}`;
        default:
            return DIRECT_ACTIONS[action] ?? humanize(action);
    }
}
