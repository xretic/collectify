'use client';

import { useState } from 'react';
import type { ReportFilters } from '@/entities/moderation/api/managementApi';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { useManagementUrl } from '../model/useManagementUrl';
import { AuditPanel } from './AuditPanel';
import { ManagementSidebar } from './ManagementSidebar';
import { ReportPanel } from './ReportPanel';
import { UserPanel } from './UserPanel';
import styles from './ManagementPage.module.css';

export default function ManagementPage() {
    const { user } = useSessionUser();
    const url = useManagementUrl();
    const [reportFilters, setReportFilters] = useState<ReportFilters>({ status: 'OPEN' });

    if (!user) return <Spinner variant="page" />;

    const isAdmin = user.roles.includes('Admin');

    const openUser = (userId: number) => {
        url.setTab('users');
        url.selectUser(userId);
    };

    return (
        <div className={styles.page}>
            <ManagementSidebar
                tab={url.tab}
                onTabChange={url.setTab}
                userId={url.userId}
                onSelectUser={url.selectUser}
                reportId={url.reportId}
                onSelectReport={url.selectReport}
                reportFilters={reportFilters}
                onReportFiltersChange={setReportFilters}
            />

            <div className={styles.main}>
                <section className={styles.panel}>
                    {url.tab === 'users' &&
                        (url.userId ? (
                            <UserPanel
                                key={url.userId}
                                userId={url.userId}
                                isAdmin={isAdmin}
                                onDeleted={() => url.selectUser(null)}
                            />
                        ) : (
                            <EmptyState
                                title="Select a user"
                                description="Search by username, name or email."
                            />
                        ))}

                    {url.tab === 'reports' &&
                        (url.reportId ? (
                            <ReportPanel
                                key={url.reportId}
                                reportId={url.reportId}
                                isAdmin={isAdmin}
                                onManageUser={openUser}
                                onReviewed={() => url.selectReport(null)}
                            />
                        ) : (
                            <EmptyState
                                title="Select a report"
                                description="The oldest open reports are at the top."
                            />
                        ))}
                </section>

                {url.tab === 'users' && url.userId && (
                    <AuditPanel key={url.userId} userId={url.userId} />
                )}
            </div>
        </div>
    );
}
