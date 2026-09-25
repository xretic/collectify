'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Chip } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';
import type { ReportDetails } from '@/entities/report/model/types';
import { useFormatSanction } from '@/entities/sanction/lib/format';
import { ReviewReportForm } from '@/features/report/review/ui/ReviewReportForm';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { Section } from '../Section';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';

function Evidence({ report }: { report: ReportDetails }) {
    const t = useTranslations('management.report');
    const tr = useTranslations('reports');
    const format = useFormatters();
    const { snapshot } = report;

    if (report.targetType === 'USER') {
        return <p className={styles.muted}>{t('aboutAccount')}</p>;
    }

    return (
        <div className={styles.evidence}>
            {!report.contentExists && (
                <Chip size="small" color="warning" label={t('deletedSince')} />
            )}

            {snapshot?.name && <strong>{snapshot.name}</strong>}
            {snapshot?.category && <span className={styles.muted}>{snapshot.category}</span>}
            {(snapshot?.text ?? snapshot?.description) && (
                <blockquote className={styles.quote}>
                    {snapshot?.text ?? snapshot?.description}
                </blockquote>
            )}
            {snapshot?.createdAt && (
                <span className={styles.muted}>
                    {t('posted', { date: format.dateTime(snapshot.createdAt) })}
                </span>
            )}

            {report.contentExists && report.contentLink && (
                <Link href={report.contentLink} target="_blank" className={styles.link}>
                    {tr(`openTarget.${report.targetType}`)}
                </Link>
            )}
        </div>
    );
}

function ClosedSummary({ report }: { report: ReportDetails }) {
    const t = useTranslations('management.report');
    const tr = useTranslations('reports');
    const format = useFormatters();
    const formatSanction = useFormatSanction();

    return (
        <dl className={styles.summary}>
            <dt>{t('verdict')}</dt>
            <dd>{tr(`verdicts.${report.verdict}`)}</dd>

            {report.reviewedBy && (
                <>
                    <dt>{t('reviewedBy')}</dt>
                    <dd>
                        @{report.reviewedBy.username}
                        {report.reviewedAt && ` · ${format.dateTime(report.reviewedAt)}`}
                    </dd>
                </>
            )}

            {report.sanction && (
                <>
                    <dt>{t('sanction')}</dt>
                    <dd>{formatSanction(report.sanction)}</dd>
                </>
            )}

            {report.duplicateOfId && (
                <>
                    <dt>{t('duplicateOf')}</dt>
                    <dd>#{report.duplicateOfId}</dd>
                </>
            )}

            {report.resolution && (
                <>
                    <dt>{t('resolution')}</dt>
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
    const t = useTranslations('management.report');
    const tr = useTranslations('reports');
    const format = useFormatters();
    const formatSanction = useFormatSanction();
    const {
        data: report,
        isPending,
        isError,
    } = useQuery({
        queryKey: managementQueryKeys.report(reportId),
        queryFn: () => managementApi.report(reportId),
    });

    if (isPending) return <Spinner />;
    if (isError || !report) return <EmptyState title={t('notFound')} />;

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
                        {t.rich('title', {
                            id: report.id,
                            username: report.targetUser.username,
                            user: (chunks) => (
                                <button
                                    type="button"
                                    className={styles.userLink}
                                    onClick={() => onManageUser(report.targetUser.id)}
                                >
                                    {chunks}
                                </button>
                            ),
                        })}
                    </h2>
                    <p className={styles.muted}>
                        {t('subtitle', {
                            target: tr(`targets.${report.targetType}`),
                            username: report.reporter.username,
                            date: format.dateTime(report.createdAt),
                        })}
                    </p>
                </div>
            </header>

            <div className={styles.chips}>
                <Chip
                    size="small"
                    label={tr(`reasons.${report.reason}`)}
                    color="error"
                    variant="outlined"
                />
                <Chip
                    size="small"
                    label={report.status === 'OPEN' ? t('open') : t('closed')}
                    variant="outlined"
                />
            </div>

            {report.details && <p className={styles.details}>{report.details}</p>}

            <Section title={t('evidence')}>
                <Evidence report={report} />
            </Section>

            <Section title={t('context')}>
                <dl className={styles.facts}>
                    <div>
                        <dt>{t('against', { username: report.targetUser.username })}</dt>
                        <dd>
                            {t('againstCounts', {
                                total: context.targetReports,
                                guilty: context.targetGuiltyReports,
                            })}
                        </dd>
                    </div>
                    <div>
                        <dt>{t('filedBy', { username: report.reporter.username })}</dt>
                        <dd>
                            {t('filedCounts', {
                                total: context.reporterReports,
                                rejected: context.reporterRejectedReports,
                            })}
                        </dd>
                    </div>
                    <div>
                        <dt>{t('activeSanctions')}</dt>
                        <dd>
                            {context.targetActiveSanctions.length === 0
                                ? t('none')
                                : context.targetActiveSanctions.map(formatSanction).join(', ')}
                        </dd>
                    </div>
                </dl>
            </Section>

            <Section title={report.status === 'OPEN' ? t('decision') : t('outcome')}>
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
