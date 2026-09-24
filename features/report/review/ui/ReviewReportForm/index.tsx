'use client';

import { useState } from 'react';
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import {
    DEFAULT_SCOPE_FOR_TARGET,
    REPORT_VERDICT_LABELS,
    REVIEW_VERDICTS,
    type ReportDetails,
    type ReviewReportPayload,
    type ReviewVerdict,
} from '@/entities/report/model/types';
import {
    SANCTION_DURATION_LABELS,
    SANCTION_DURATIONS,
    SANCTION_SCOPE_LABELS,
    SANCTION_SCOPES,
    type SanctionDuration,
    type SanctionScope,
} from '@/entities/sanction/model/types';
import { useModerationMutation } from '@/entities/moderation/model/useModerationMutation';
import { MODERATION_NOTE_MAX_LENGTH } from '@/shared/lib/constants';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import styles from './index.module.css';

type ReviewReportFormProps = {
    report: ReportDetails;
    isAdmin: boolean;
    onReviewed: () => void;
};

function describe(payload: ReviewReportPayload, username: string) {
    const parts = [`Verdict: ${REPORT_VERDICT_LABELS[payload.verdict]}.`];

    if (payload.removeContent) parts.push('The reported content will be deleted.');
    if (payload.punishment) {
        parts.push(
            `@${username} gets ${SANCTION_SCOPE_LABELS[payload.punishment.scope].toLowerCase()} for ${SANCTION_DURATION_LABELS[
                payload.punishment.duration
            ].toLowerCase()}.`,
        );
    }
    if (payload.duplicateOfId)
        parts.push(`Marked as duplicate of report #${payload.duplicateOfId}.`);

    return parts.join(' ');
}

/**
 * Starts empty on purpose: the moderator must pick a verdict, and a guilty
 * verdict needs an explicit confirmation of the punishment.
 */
export function ReviewReportForm({ report, isAdmin, onReviewed }: ReviewReportFormProps) {
    const hasContent = report.targetType !== 'USER' && report.contentExists;

    const [verdict, setVerdict] = useState<ReviewVerdict | ''>('');
    const [removeContent, setRemoveContent] = useState(
        hasContent && report.targetType !== 'COLLECTION',
    );
    const [punish, setPunish] = useState(true);
    const [scope, setScope] = useState<SanctionScope>(DEFAULT_SCOPE_FOR_TARGET[report.targetType]);
    const [duration, setDuration] = useState<SanctionDuration>('1d');
    const [duplicateOf, setDuplicateOf] = useState('');
    const [resolution, setResolution] = useState('');
    const [confirming, setConfirming] = useState(false);

    const guilty = verdict === 'GUILTY';
    const duplicateOfId =
        verdict === 'DUPLICATE' && /^\d+$/.test(duplicateOf) ? Number(duplicateOf) : null;

    const payload: ReviewReportPayload | null = verdict
        ? {
              verdict,
              resolution: resolution.trim(),
              removeContent: guilty && hasContent && removeContent,
              punishment: guilty && punish ? { scope, duration } : null,
              duplicateOfId,
          }
        : null;

    const ready = payload !== null && (verdict !== 'DUPLICATE' || duplicateOfId !== null);

    const review = useModerationMutation(
        (body: ReviewReportPayload) => managementApi.reviewReport(report.id, body),
        (result) =>
            result.sanctionApplied || !payload?.punishment
                ? 'Report closed.'
                : 'Report closed. A stronger sanction was already active and was kept.',
    );

    const submit = () =>
        payload &&
        review.mutate(payload, {
            onSuccess: () => {
                setConfirming(false);
                onReviewed();
            },
        });

    return (
        <div className={styles.form}>
            <FormControl size="small" className={styles.wide}>
                <InputLabel id="report-verdict">Verdict</InputLabel>
                <Select
                    labelId="report-verdict"
                    label="Verdict"
                    value={verdict}
                    onChange={(event) => setVerdict(event.target.value as ReviewVerdict)}
                >
                    {REVIEW_VERDICTS.map((value) => (
                        <MenuItem key={value} value={value}>
                            {REPORT_VERDICT_LABELS[value]}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {guilty && (
                <div className={styles.group}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={hasContent && removeContent}
                                disabled={!hasContent}
                                onChange={(event) => setRemoveContent(event.target.checked)}
                            />
                        }
                        label={hasContent ? 'Delete the reported content' : 'Nothing to delete'}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={punish}
                                onChange={(event) => setPunish(event.target.checked)}
                            />
                        }
                        label="Sanction the user"
                    />

                    {punish && (
                        <div className={styles.row}>
                            <FormControl size="small" className={styles.select}>
                                <InputLabel id="report-scope">Punishment</InputLabel>
                                <Select
                                    labelId="report-scope"
                                    label="Punishment"
                                    value={scope}
                                    onChange={(event) =>
                                        setScope(event.target.value as SanctionScope)
                                    }
                                >
                                    {SANCTION_SCOPES.map((value) => (
                                        <MenuItem key={value} value={value}>
                                            {SANCTION_SCOPE_LABELS[value]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" className={styles.select}>
                                <InputLabel id="report-duration">Duration</InputLabel>
                                <Select
                                    labelId="report-duration"
                                    label="Duration"
                                    value={duration}
                                    onChange={(event) =>
                                        setDuration(event.target.value as SanctionDuration)
                                    }
                                >
                                    {SANCTION_DURATIONS.map((value) => (
                                        <MenuItem
                                            key={value}
                                            value={value}
                                            disabled={value === 'permanent' && !isAdmin}
                                        >
                                            {SANCTION_DURATION_LABELS[value]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    )}
                </div>
            )}

            {verdict === 'DUPLICATE' && (
                <TextField
                    size="small"
                    label="Original report #"
                    value={duplicateOf}
                    onChange={(event) => setDuplicateOf(event.target.value.replace(/\D/g, ''))}
                    className={styles.wide}
                />
            )}

            <TextField
                size="small"
                label="Resolution note"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                multiline
                minRows={2}
                slotProps={{ htmlInput: { maxLength: MODERATION_NOTE_MAX_LENGTH } }}
                className={styles.wide}
            />

            <div>
                <Button
                    variant="contained"
                    color={guilty ? 'error' : 'primary'}
                    disabled={!ready || review.isPending}
                    onClick={() => setConfirming(true)}
                >
                    Close report
                </Button>
            </div>

            <ConfirmDialog
                open={confirming}
                title={`Close report #${report.id}?`}
                description={payload && describe(payload, report.targetUser.username)}
                confirmLabel="Close report"
                destructive={guilty}
                pending={review.isPending}
                onClose={() => setConfirming(false)}
                onConfirm={submit}
            />
        </div>
    );
}
