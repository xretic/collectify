'use client';

import styles from '@/app/management/management.module.css';
import { useManagementPage } from '../model/useManagementPage';
import { AuditPanel } from './AuditPanel';
import { ManagementSidebar } from './ManagementSidebar';
import { ReportsPanel } from './ReportsPanel';
import { UsersPanel } from './UsersPanel';

export default function ManagementPage() {
    const management = useManagementPage();

    if (management.loading) return null;
    if (!management.canManage) return null;

    return (
        <main className={styles.page}>
            <ManagementSidebar
                busy={management.busy}
                users={management.users}
                reports={management.reports}
                viewMode={management.viewMode}
                setViewMode={management.setViewMode}
                selected={management.selected}
                selectedReport={management.selectedReport}
                query={management.query}
                setQuery={management.setQuery}
                onRefresh={management.load}
                onSelectUser={management.setSelectedId}
                onSelectReport={management.setSelectedReportId}
                onLoadMoreUsers={management.loadMoreUsers}
                onLoadMoreReports={management.loadMoreReports}
                usersHasMore={management.usersNextSkip !== null}
                reportsHasMore={management.reportsNextSkip !== null}
            />

            <section className={styles.panel}>
                {management.error && <div className={styles.error}>{management.error}</div>}

                {management.viewMode === 'reports' ? (
                    <ReportsPanel
                        busy={management.busy}
                        isAdmin={management.isAdmin}
                        selectedReport={management.selectedReport}
                        reportVerdict={management.reportVerdict}
                        setReportVerdict={management.setReportVerdict}
                        reportPunishmentScope={management.reportPunishmentScope}
                        setReportPunishmentScope={management.setReportPunishmentScope}
                        reportPunishmentDuration={management.reportPunishmentDuration}
                        setReportPunishmentDuration={management.setReportPunishmentDuration}
                        reportResolution={management.reportResolution}
                        setReportResolution={management.setReportResolution}
                        onReview={management.reviewReport}
                    />
                ) : (
                    <UsersPanel
                        busy={management.busy}
                        isAdmin={management.isAdmin}
                        selected={management.selected}
                        selectedRoles={management.selectedRoles}
                        collectionHistory={management.collectionHistory}
                        commentHistory={management.commentHistory}
                        collectionNextSkip={management.collectionNextSkip}
                        commentNextSkip={management.commentNextSkip}
                        messageHistory={management.messageHistory}
                        messageNextSkip={management.messageNextSkip}
                        historyOpen={management.historyOpen}
                        setHistoryOpen={management.setHistoryOpen}
                        onCopyUsername={management.copyUsername}
                        onRole={management.setRole}
                        onSanction={management.createSanction}
                        onRevokeSanction={management.revokeSanction}
                        onDeleteUser={management.deleteUser}
                        onImpersonate={management.impersonate}
                        onLoadCollections={management.loadCollections}
                        onLoadComments={management.loadComments}
                        onLoadMessageHistory={management.loadMessageHistory}
                        onLoadMoreMessages={management.loadMoreMessages}
                        scope={management.scope}
                        setScope={management.setScope}
                        duration={management.duration}
                        setDuration={management.setDuration}
                        reason={management.reason}
                        setReason={management.setReason}
                    />
                )}
            </section>

            <AuditPanel
                audit={management.audit}
                busy={management.busy}
                hasMore={management.auditNextSkip !== null}
                onLoadMore={management.loadMoreAudit}
            />
        </main>
    );
}
