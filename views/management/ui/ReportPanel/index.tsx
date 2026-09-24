'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Chip } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';
import {
    REPORT_REASON_LABELS,
    REPORT_TARGET_LABELS,
    REPORT_VERDICT_LABELS,
    type ReportDetails,
} from '@/entities/report/model/types';
import { formatSanction } from '@/entities/sanction/lib/format';
import { ReviewReportForm } from '@/features/report/review/ui/ReviewReportForm';
import { formatDateTime } from '@/shared/lib/format/date';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { Section } from '../Section';
import styles from './index.module.css';

function Evidence({ report }: { report: ReportDetails }) {
    const { snapshot } = report;

    if (report.targetType === 'USER') {
        return <p className={styles.muted}>The report is about the account itself.</p>;
    }

    return (
        <div className={styles.evidence}>
            {!report.contentExists && (
                <Chip
                    size="small"
                    color="warning"
                    label="Deleted since — showing the snapshot taken at report time"
                />
            )}

            {snapshot?.name && <strong>{snapshot.name}</strong>}
            {snapshot?.category && <span className={styles.muted}>{snapshot.category}</span>}
            {(snapshot?.text ?? snapshot?.description) && (
                <blockquote className={styles.quote}>
                    {snapshot?.text ?? snapshot?.description}
                </blockquote>
            )}
            {snapshot?.createdAt && (
                <span className={styles.muted}>Posted {formatDateTime(snapshot.createdAt)}</span>
            )}

            {report.contentExists && report.contentLink && (
                <Link href={report.contentLink} target="_blank" className={styles.link}>
                    Open {REPORT_TARGET_LABELS[report.targetType].toLowerCase()}
                </Link>
            )}
        </div>
    );
}

function ClosedSummary({ report }: { report: ReportDetails }) {
    return (
        <dl className={styles.summary}>
            <dt>Verdict</dt>
            <dd>{REPORT_VERDICT_LABELS[report.verdict]}</dd>

            {report.reviewedBy && (
                <>
                    <dt>Reviewed by</dt>
                    <dd>
                        @{report.reviewedBy.username}
                        {report.reviewedAt && ` · ${formatDateTime(report.reviewedAt)}`}
                    </dd>
                </>
            )}

            {report.sanction && (
                <>
                    <dt>Sanction</dt>
                    <dd>{formatSanction(report.sanction)}</dd>
                </>
            )}

            {report.duplicateOfId && (
                <>
                    <dt>Duplicate of</dt>
                    <dd>#{report.duplicateOfId}</dd>
                </>
            )}

            {report.resolution && (
                <>
                    <dt>Resolution</dt>
                    <dd>{report.resolution}</dd>
                </>
            )}
        </dl>
    );
}

type ReportPanelProps = {
    reportId: number;
    isAdmin: boolean;
    onManageUser: (userId: number) => void;
    onReviewed: () => void;
};

export function ReportPanel({ reportId, isAdmin, onManageUser, onReviewed }: ReportPanelProps) {
    const {
        data: report,
        isPending,
        isError,
    } = useQuery({
        queryKey: managementQueryKeys.report(reportId),
        queryFn: () => managementApi.report(reportId),
    });

    if (isPending) return <Spinner />;
    if (isError || !report) return <EmptyState title="Report not found" />;

    const { context } = report;

    return (
        <>
            <header className={styles.header}>
                <Avatar
                    src={report.targetUser.avatarUrl}
                    alt={report.targetUser.username}
                    className={styles.avatar}
                />
                <div>
                    <h2 className={styles.title}>
                        Report #{report.id} on{' '}
                        <button
                            type="button"
                            className={styles.userLink}
                            onClick={() => onManageUser(report.targetUser.id)}
                        >
                            @{report.targetUser.username}
                        </button>
                    </h2>
                    <p className={styles.muted}>
                        {REPORT_TARGET_LABELS[report.targetType]} · reported by @
                        {report.reporter.username} · {formatDateTime(report.createdAt)}
                    </p>
                </div>
            </header>

            <div className={styles.chips}>
                <Chip
                    size="small"
                    label={REPORT_REASON_LABELS[report.reason]}
                    color="error"
                    variant="outlined"
                />
                <Chip
                    size="small"
                    label={report.status === 'OPEN' ? 'Open' : 'Closed'}
                    variant="outlined"
                />
            </div>

            {report.details && <p className={styles.details}>{report.details}</p>}

            <Section title="Evidence">
                <Evidence report={report} />

                {context.messages.length > 0 && (
                    <div className={styles.conversation}>
                        {context.messages.map((message) => (
                            <div
                                key={message.id}
                                className={`${styles.message} ${message.reported ? styles.reported : ''}`}
                            >
                                <span className={styles.muted}>
                                    @{message.authorUsername} · {formatDateTime(message.createdAt)}
                                </span>
                                <p>{message.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            <Section title="Context">
                <dl className={styles.facts}>
                    <div>
                        <dt>Reports against @{report.targetUser.username}</dt>
                        <dd>
                            {context.targetReports} total · {context.targetGuiltyReports} guilty
                        </dd>
                    </div>
                    <div>
                        <dt>Reports filed by @{report.reporter.username}</dt>
                        <dd>
                            {context.reporterReports} total · {context.reporterRejectedReports}{' '}
                            rejected
                        </dd>
                    </div>
                    <div>
                        <dt>Active sanctions</dt>
                        <dd>
                            {context.targetActiveSanctions.length === 0
                                ? 'None'
                                : context.targetActiveSanctions.map(formatSanction).join(', ')}
                        </dd>
                    </div>
                </dl>
            </Section>

            <Section title={report.status === 'OPEN' ? 'Decision' : 'Outcome'}>
                {report.status === 'OPEN' ? (
                    <ReviewReportForm
                        key={report.id}
                        report={report}
                        isAdmin={isAdmin}
                        onReviewed={onReviewed}
                    />
                ) : (
                    <ClosedSummary report={report} />
                )}
            </Section>
        </>
    );
}
