import type { ReportFilters } from '../api/managementApi';

export const managementQueryKeys = {
    all: ['management'] as const,
    users: (query: string, userId: number | null) =>
        [...managementQueryKeys.all, 'users', { query, userId }] as const,
    usersRoot: () => [...managementQueryKeys.all, 'users'] as const,
    reports: (filters: ReportFilters) => [...managementQueryKeys.all, 'reports', filters] as const,
    reportsRoot: () => [...managementQueryKeys.all, 'reports'] as const,
    report: (reportId: number) => [...managementQueryKeys.all, 'report', reportId] as const,
    audit: (userId: number) => [...managementQueryKeys.all, 'audit', userId] as const,
    collections: (userId: number) => [...managementQueryKeys.all, 'collections', userId] as const,
    comments: (userId: number) => [...managementQueryKeys.all, 'comments', userId] as const,
    chats: (userId: number) => [...managementQueryKeys.all, 'chats', userId] as const,
};
