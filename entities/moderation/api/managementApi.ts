import { api } from '@/shared/api/api';
import type {
    ReportDetails,
    ReportReason,
    ReportsPage,
    ReportStatus,
    ReportTargetType,
    ReviewReportPayload,
} from '@/entities/report/model/types';
import type { SanctionDuration, SanctionScope } from '@/entities/sanction/model/types';
import type {
    AuditPage,
    HistoryPage,
    ManagedChat,
    ManagedCollection,
    ManagedComment,
    ManagementUsersPage,
} from '../model/types';

export type ReportFilters = {
    status: ReportStatus;
    targetType?: ReportTargetType;
    reason?: ReportReason;
};

const compact = (params: Record<string, string | number | undefined | null>) =>
    Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== '',
        ),
    ) as Record<string, string | number>;

export const managementApi = {
    users(params: { query: string; page: number; userId?: number | null }) {
        return api
            .get('management/users', { searchParams: compact(params) })
            .json<ManagementUsersPage>();
    },

    audit(userId: number, cursor: number | null) {
        return api
            .get('management/audit', { searchParams: compact({ userId, cursor }) })
            .json<AuditPage>();
    },

    reports(filters: ReportFilters, cursor: number | null) {
        return api
            .get('management/reports', { searchParams: compact({ ...filters, cursor }) })
            .json<ReportsPage>();
    },

    async report(reportId: number) {
        return (await api.get(`management/reports/${reportId}`).json<{ report: ReportDetails }>())
            .report;
    },

    reviewReport(reportId: number, payload: ReviewReportPayload) {
        return api
            .patch(`management/reports/${reportId}`, { json: payload })
            .json<{ sanctionApplied: boolean; report: ReportDetails }>();
    },

    collections(userId: number, skip: number) {
        return api
            .get(`management/users/${userId}/collections`, { searchParams: { skip } })
            .json<HistoryPage<ManagedCollection>>();
    },

    comments(userId: number, skip: number) {
        return api
            .get(`management/users/${userId}/comments`, { searchParams: { skip } })
            .json<HistoryPage<ManagedComment>>();
    },

    chats(userId: number, skip: number) {
        return api
            .get(`management/users/${userId}/messages`, { searchParams: { skip } })
            .json<HistoryPage<ManagedChat>>();
    },

    async setRole(
        userId: number,
        role: 'Moderator' | 'Verified',
        enabled: boolean,
        reason: string,
    ) {
        await api.patch(`management/users/${userId}/roles`, { json: { role, enabled, reason } });
    },

    issueSanction(
        userId: number,
        payload: { scope: SanctionScope; duration: SanctionDuration; reason: string },
    ) {
        return api
            .post(`management/users/${userId}/sanctions`, { json: payload })
            .json<{ sanctionId: number; applied: boolean }>();
    },

    async revokeSanction(sanctionId: number) {
        await api.delete(`management/sanctions/${sanctionId}`);
    },

    async deleteUser(userId: number) {
        await api.delete(`management/users/${userId}`);
    },

    async impersonate(userId: number) {
        await api.post(`management/users/${userId}/impersonate`);
    },
};
