'use client';

import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import styles from './index.module.css';
import { reportApi, ReportReason } from '@/entities/report/api/reportApi';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';

type ReportDialogProps = {
    open: boolean;
    onClose: () => void;
    targetUserId: number;
    targetUsername: string;
    messageId?: number;
    messagePreview?: string;
    commentId?: number;
    commentPreview?: string;
    collectionId?: number;
    collectionPreview?: string;
};

export default function ReportDialog({
    open,
    onClose,
    targetUserId,
    targetUsername,
    messageId,
    messagePreview,
    commentId,
    commentPreview,
    collectionId,
    collectionPreview,
}: ReportDialogProps) {
    const [reason, setReason] = useState<ReportReason>('spam');
    const [details, setDetails] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const handleClose = () => {
        if (busy) return;
        setError('');
        setDetails('');
        onClose();
    };

    const handleSubmit = async () => {
        setBusy(true);
        setError('');

        try {
            await reportApi.create({
                targetUserId,
                messageId,
                commentId,
                collectionId,
                reason,
                details,
            });
            setError('');
            setDetails('');
            onClose();
        } catch (err) {
            setError(await getApiErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog className={styles.dialog} open={open} onClose={handleClose}>
            <DialogTitle>
                {collectionId
                    ? 'Report collection'
                    : commentId
                      ? 'Report comment'
                      : messageId
                        ? 'Report message'
                        : 'Report user'}
            </DialogTitle>
            <DialogContent>
                <div className={styles.content}>
                    <div className={styles.target}>
                        <div className={styles.targetTitle}>@{targetUsername}</div>
                        {(messagePreview || commentPreview || collectionPreview) && (
                            <div className={styles.quote}>
                                {messagePreview || commentPreview || collectionPreview}
                            </div>
                        )}
                    </div>

                    <FormControl size="small" fullWidth>
                        <InputLabel>Reason</InputLabel>
                        <Select
                            label="Reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value as ReportReason)}
                        >
                            <MenuItem value="spam">Spam</MenuItem>
                            <MenuItem value="harassment">Harassment</MenuItem>
                            <MenuItem value="hate">Hate speech</MenuItem>
                            <MenuItem value="scam">Scam</MenuItem>
                            <MenuItem value="adult">Adult content</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Details"
                        value={details}
                        onChange={(event) => setDetails(event.target.value)}
                        multiline
                        minRows={3}
                        inputProps={{ maxLength: 1000 }}
                    />

                    {error && <div className={styles.quote}>{error}</div>}

                    <div className={styles.actions}>
                        <Button variant="outlined" onClick={handleClose} disabled={busy}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
                            Submit report
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
