'use client';

import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import type { CollectionItemPayload } from '@/entities/collection/model/types';
import { emptyItemDraft, toItemPayload, type ItemDraft } from '@/entities/collection/model/drafts';
import { ItemFormFields } from '@/entities/collection/ui/ItemFormFields';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type ItemFormDialogProps = {
    mode: 'create' | 'edit';
    initial?: ItemDraft;
    pending: boolean;
    onSubmit: (payload: CollectionItemPayload) => void;
    onClose: () => void;
};

/** Add / edit item form. Mount it only while open so each opening starts fresh. */
export function ItemFormDialog({
    mode,
    initial = emptyItemDraft,
    pending,
    onSubmit,
    onClose,
}: ItemFormDialogProps) {
    const t = useTranslations('items');
    const tc = useTranslations('common');
    const [draft, setDraft] = useState(initial);
    const payload = toItemPayload(draft);

    return (
        <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>{mode === 'create' ? t('add') : t('edit')}</DialogTitle>

            <DialogContent className={styles.content}>
                <DialogContentText color="inherit" className={styles.intro}>
                    {mode === 'create' ? t('addIntro') : t('editIntro')}
                </DialogContentText>

                <ItemFormFields value={draft} onChange={setDraft} />
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={pending}>
                    {tc('cancel')}
                </Button>
                <Button
                    variant="contained"
                    disabled={!payload || pending}
                    onClick={() => payload && onSubmit(payload)}
                >
                    {mode === 'create' ? tc('add') : tc('save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
