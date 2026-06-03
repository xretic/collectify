'use client';

import styles from '@/app/management/management.module.css';
import {
    Avatar,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import { ManagementReport, SanctionScope } from '@/entities/management/api/managementApi';
import { formatDateTime } from '../lib/format';
import { Duration, ReviewVerdict } from '../model/types';
import { DurationSelect } from './DurationSelect';

type ReportsPanelProps = {
    busy: boolean;
    isAdmin: boolean;
    selectedReport: ManagementReport | null;
    reportVerdict: ReviewVerdict;
    setReportVerdict: (value: ReviewVerdict) => void;
    reportPunishmentScope: SanctionScope;
    setReportPunishmentScope: (value: SanctionScope) => void;
    reportPunishmentDuration: Duration;
    setReportPunishmentDuration: (value: Duration) => void;
    reportResolution: string;
    setReportResolution: (value: string) => void;
    onReview: () => void;
};

export function ReportsPanel({
    busy,
    isAdmin,
    selectedReport,
    reportVerdict,
    setReportVerdict,
    reportPunishmentScope,
    setReportPunishmentScope,
    reportPunishmentDuration,
    setReportPunishmentDuration,
    reportResolution,
    setReportResolution,
    onReview,
}: ReportsPanelProps) {
    if (!selectedReport) return <p className={styles.muted}>No reports to review.</p>;

    return (
        <div className={styles.reportReview}>
            <div className={styles.profileHeader}>
                <Avatar
                    src={selectedReport.targetUser.avatarUrl}
                    alt={selectedReport.targetUser.username}
                    sx={{ width: 58, height: 58 }}
                />
                <div>
                    <h2 className={styles.subtitle}>
                        Report on @{selectedReport.targetUser.username}
                    </h2>
                    <p className={styles.muted}>
                        Reported by @{selectedReport.reporter.username} ·{' '}
                        {formatDateTime(selectedReport.createdAt)}
                    </p>
                </div>
            </div>

            <div className={styles.reportGrid}>
                <div className={styles.reportBox}>
                    <span className={styles.sectionHint}>Reason</span>
                    <strong>{selectedReport.reason}</strong>
                    {selectedReport.details && <p>{selectedReport.details}</p>}
                </div>

                {selectedReport.message && (
                    <div className={styles.reportBox}>
                        <span className={styles.sectionHint}>Reported message</span>
                        <p>{selectedReport.message.content}</p>
                        <span className={styles.muted}>
                            Chat #{selectedReport.message.chatId} ·{' '}
                            {formatDateTime(selectedReport.message.createdAt)}
                        </span>
                    </div>
                )}

                {selectedReport.comment && (
                    <div className={styles.reportBox}>
                        <span className={styles.sectionHint}>Reported comment</span>
                        <p>{selectedReport.comment.text}</p>
                        <span className={styles.muted}>
                            {selectedReport.comment.Collection.name} ·{' '}
                            {formatDateTime(selectedReport.comment.createdAt)}
                        </span>
                    </div>
                )}

                {selectedReport.collection && (
                    <div className={styles.reportBox}>
                        <span className={styles.sectionHint}>Reported collection</span>
                        <a
                            className={styles.reportLink}
                            href={`/collections/${selectedReport.collection.id}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {selectedReport.collection.name}
                        </a>
                        <span className={styles.muted}>
                            {selectedReport.collection.category} ·{' '}
                            {formatDateTime(selectedReport.collection.createdAt)}
                            {selectedReport.collection.private ? ' · private' : ''}
                        </span>
                        {selectedReport.collection.description && (
                            <p>{selectedReport.collection.description}</p>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Verdict</h3>
                    <span className={styles.sectionHint}>
                        Choose outcome and punishment if guilty
                    </span>
                </div>

                <div className={styles.sanctionForm}>
                    <FormControl size="small">
                        <InputLabel>Verdict</InputLabel>
                        <Select
                            label="Verdict"
                            value={reportVerdict}
                            onChange={(event) =>
                                setReportVerdict(event.target.value as ReviewVerdict)
                            }
                        >
                            <MenuItem value="GUILTY">Guilty</MenuItem>
                            <MenuItem value="NO_VIOLATION">No violation</MenuItem>
                            <MenuItem value="INSUFFICIENT_EVIDENCE">Insufficient evidence</MenuItem>
                            <MenuItem value="DUPLICATE">Duplicate</MenuItem>
                        </Select>
                    </FormControl>

                    {reportVerdict === 'GUILTY' && (
                        <>
                            <FormControl size="small">
                                <InputLabel>Punishment</InputLabel>
                                <Select
                                    label="Punishment"
                                    value={reportPunishmentScope}
                                    onChange={(event) =>
                                        setReportPunishmentScope(
                                            event.target.value as SanctionScope,
                                        )
                                    }
                                >
                                    <MenuItem value="ACCOUNT">Account ban</MenuItem>
                                    <MenuItem value="COMMENTS">Comments mute</MenuItem>
                                    <MenuItem value="MESSENGER">Messenger mute</MenuItem>
                                </Select>
                            </FormControl>

                            <DurationSelect
                                value={reportPunishmentDuration}
                                setValue={setReportPunishmentDuration}
                                isAdmin={isAdmin}
                            />
                        </>
                    )}

                    <TextField
                        label="Resolution note"
                        size="small"
                        value={reportResolution}
                        onChange={(event) => setReportResolution(event.target.value)}
                    />

                    <Button
                        variant="contained"
                        disabled={busy}
                        onClick={onReview}
                        sx={{ textTransform: 'none' }}
                    >
                        Close report
                    </Button>
                </div>
            </div>
        </div>
    );
}
