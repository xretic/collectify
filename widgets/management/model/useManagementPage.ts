import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    AuditAction,
    ManagementCollectionHistoryItem,
    ManagementCommentHistoryItem,
    managementApi,
    ManagementMessageHistory,
    ManagementReport,
    ManagementUser,
    SanctionScope,
} from '@/entities/management/api/managementApi';
import { useUser } from '@/app/providers/UserProvider';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { UserRole } from '@/types/UserRole';
import { durationToExpiresAt } from '../lib/format';
import { Duration, ReviewVerdict, ViewMode } from './types';

export function useManagementPage() {
    const { user, loading } = useUser();
    const searchParams = useSearchParams();
    const initialUserId = Number(searchParams.get('userId'));
    const [users, setUsers] = useState<ManagementUser[]>([]);
    const [audit, setAudit] = useState<AuditAction[]>([]);
    const [reports, setReports] = useState<ManagementReport[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('users');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [targetUserId, setTargetUserId] = useState<number | null>(
        Number.isInteger(initialUserId) && initialUserId > 0 ? initialUserId : null,
    );
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState<SanctionScope>('ACCOUNT');
    const [duration, setDuration] = useState<Duration>('1d');
    const [reason, setReason] = useState('');
    const [reportVerdict, setReportVerdict] = useState<ReviewVerdict>('GUILTY');
    const [reportPunishmentScope, setReportPunishmentScope] = useState<SanctionScope>('MESSENGER');
    const [reportPunishmentDuration, setReportPunishmentDuration] = useState<Duration>('1d');
    const [reportResolution, setReportResolution] = useState('');
    const [collectionHistory, setCollectionHistory] = useState<ManagementCollectionHistoryItem[]>(
        [],
    );
    const [commentHistory, setCommentHistory] = useState<ManagementCommentHistoryItem[]>([]);
    const [collectionNextSkip, setCollectionNextSkip] = useState<number | null>(0);
    const [commentNextSkip, setCommentNextSkip] = useState<number | null>(0);
    const [messageHistory, setMessageHistory] = useState<ManagementMessageHistory | null>(null);
    const [messageNextSkip, setMessageNextSkip] = useState<number | null>(0);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const isAdmin = !!user?.roles.includes('Admin');
    const canManage = !!user?.roles.some((role) => role === 'Admin' || role === 'Moderator');
    const selected = users.find((item) => item.id === selectedId) ?? users[0] ?? null;
    const selectedReport =
        reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;
    const selectedRoles = useMemo(() => new Set(selected?.roles ?? []), [selected?.roles]);

    const load = useCallback(async () => {
        setBusy(true);
        setError('');

        try {
            const [usersData, auditData, reportsData] = await Promise.all([
                managementApi.users(query, 0, targetUserId),
                managementApi.audit(),
                managementApi.reports('OPEN'),
            ]);

            setUsers(usersData.data);
            setAudit(auditData.data);
            setReports(reportsData.data);
            setSelectedId((current) =>
                usersData.data.some((item) => item.id === current)
                    ? current
                    : (usersData.data[0]?.id ?? null),
            );
            setSelectedReportId((current) =>
                reportsData.data.some((report) => report.id === current)
                    ? current
                    : (reportsData.data[0]?.id ?? null),
            );
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    }, [query, targetUserId]);

    useEffect(() => {
        if (!loading && canManage) void load();
    }, [loading, canManage, load]);

    useEffect(() => {
        setCollectionHistory([]);
        setCommentHistory([]);
        setCollectionNextSkip(0);
        setCommentNextSkip(0);
        setMessageHistory(null);
        setMessageNextSkip(0);
        setHistoryOpen(false);
    }, [selected?.id]);

    const reloadAfterAction = async () => {
        await load();
    };

    const copyUsername = async () => {
        if (!selected) return;
        await navigator.clipboard.writeText(selected.username);
    };

    const setRole = async (role: UserRole, enabled: boolean) => {
        if (!selected) return;
        setBusy(true);
        setError('');

        try {
            await managementApi.setRole(selected.id, role, enabled, reason);
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const updateQuery = (value: string) => {
        setTargetUserId(null);
        setQuery(value);
    };

    const createSanction = async () => {
        if (!selected) return;
        setBusy(true);
        setError('');

        try {
            await managementApi.createSanction(
                selected.id,
                scope,
                durationToExpiresAt(duration),
                reason,
            );
            setReason('');
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const revokeSanction = async (sanctionId: number) => {
        setBusy(true);
        setError('');

        try {
            await managementApi.revokeSanction(sanctionId);
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const deleteUser = async () => {
        if (!selected || !isAdmin) return;
        const confirmed = window.confirm(`Delete ${selected.username}? This cannot be undone.`);
        if (!confirmed) return;

        setBusy(true);
        setError('');

        try {
            await managementApi.deleteUser(selected.id);
            setSelectedId(null);
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const impersonate = async () => {
        if (!selected || !isAdmin) return;
        const confirmed = window.confirm(`Sign in as ${selected.username}?`);
        if (!confirmed) return;

        setBusy(true);
        setError('');

        try {
            await managementApi.impersonate(selected.id);
            window.location.href = '/';
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const loadCollections = async () => {
        if (!selected || collectionNextSkip === null) return;
        setBusy(true);
        setError('');

        try {
            const data = await managementApi.collectionHistory(selected.id, collectionNextSkip);
            setCollectionHistory((prev) => [...prev, ...data.data]);
            setCollectionNextSkip(data.nextSkip);
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const loadComments = async () => {
        if (!selected || commentNextSkip === null) return;
        setBusy(true);
        setError('');

        try {
            const data = await managementApi.commentHistory(selected.id, commentNextSkip);
            setCommentHistory((prev) => [...prev, ...data.data]);
            setCommentNextSkip(data.nextSkip);
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const loadMessageHistory = async () => {
        if (!selected || !isAdmin) return;
        setBusy(true);
        setError('');

        try {
            const data = await managementApi.messageHistory(selected.id, 0);
            setMessageHistory(data);
            setMessageNextSkip(data.nextSkip);
            setHistoryOpen(true);
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const loadMoreMessages = async () => {
        if (!selected || !messageHistory || messageNextSkip === null || !isAdmin) return;
        setBusy(true);
        setError('');

        try {
            const data = await managementApi.messageHistory(selected.id, messageNextSkip);
            setMessageHistory({
                ...data,
                chats: [...messageHistory.chats, ...data.chats],
            });
            setMessageNextSkip(data.nextSkip);
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const reviewReport = async () => {
        if (!selectedReport) return;
        setBusy(true);
        setError('');

        try {
            await managementApi.reviewReport(selectedReport.id, {
                verdict: reportVerdict,
                resolution: reportResolution,
                punishment:
                    reportVerdict === 'GUILTY'
                        ? {
                              scope: reportPunishmentScope,
                              expiresAt: durationToExpiresAt(reportPunishmentDuration),
                              reason: reportResolution || selectedReport.reason,
                          }
                        : null,
            });

            setReportResolution('');
            setSelectedReportId(null);
            await reloadAfterAction();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return {
        audit,
        busy,
        canManage,
        collectionHistory,
        collectionNextSkip,
        commentHistory,
        commentNextSkip,
        copyUsername,
        createSanction,
        deleteUser,
        duration,
        error,
        historyOpen,
        impersonate,
        isAdmin,
        load,
        loadCollections,
        loadComments,
        loadMessageHistory,
        loadMoreMessages,
        loading,
        messageHistory,
        messageNextSkip,
        query,
        reason,
        reportPunishmentDuration,
        reportPunishmentScope,
        reportResolution,
        reports,
        reportVerdict,
        reviewReport,
        revokeSanction,
        scope,
        selected,
        selectedReport,
        selectedRoles,
        setDuration,
        setHistoryOpen,
        setQuery: updateQuery,
        setReportPunishmentDuration,
        setReportPunishmentScope,
        setReportResolution,
        setReportVerdict,
        setRole,
        setScope,
        setReason,
        setSelectedId,
        setSelectedReportId,
        setViewMode,
        users,
        viewMode,
    };
}
