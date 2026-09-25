'use client';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    destructive?: boolean;
    pending?: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    destructive = false,
    pending = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    const t = useTranslations('common');

    return (
        <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            {description && (
                <DialogContent>
                    <DialogContentText component="div" color="inherit">
                        {description}
                    </DialogContentText>
                </DialogContent>
            )}
            <DialogActions>
                <Button onClick={onClose} disabled={pending}>
                    {t('cancel')}
                </Button>
                <Button
                    variant="contained"
                    color={destructive ? 'error' : 'primary'}
                    onClick={onConfirm}
                    disabled={pending}
                >
                    {confirmLabel ?? t('confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
