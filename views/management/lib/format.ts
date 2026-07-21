import {
    ManagementReport,
    ManagementUser,
    SanctionScope,
} from '@/entities/management/api/managementApi';
import { Duration } from '../model/types';

const durations: Record<Duration, number | null> = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    permanent: null,
};

const sanctionScopeLabels: Record<SanctionScope, string> = {
    ACCOUNT: 'Account ban',
    COMMENTS: 'Comments mute',
    MESSENGER: 'Messenger mute',
};

export const formatDateTime = (value: string | Date) =>
    new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

export const formatSanction = (sanction: ManagementUser['activeSanctions'][number]) => {
    const label = sanctionScopeLabels[sanction.scope];
    if (!sanction.expiresAt) return `${label} · permanent`;
    return `${label} · until ${formatDateTime(sanction.expiresAt)}`;
};

export function durationToExpiresAt(duration: Duration) {
    const ms = durations[duration];
    return ms ? new Date(Date.now() + ms).toISOString() : null;
}

export function reportKind(report: ManagementReport) {
    if (report.collection) return 'Collection report';
    if (report.comment) return 'Comment report';
    if (report.message) return 'Message report';
    return 'User report';
}
