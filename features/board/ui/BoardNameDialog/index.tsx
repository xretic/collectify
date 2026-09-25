'use client';

import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { boardNameSchema } from '@/entities/board/model/schemas';
import { BOARD_NAME_MAX_LENGTH } from '@/shared/lib/constants';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import { useTranslations } from 'next-intl';

type BoardNameDialogProps = {
    title: string;
    initialName?: string;
    submitLabel: string;
    pending: boolean;
    onSubmit: (name: string) => void;
    onClose: () => void;
};

/** Create / rename a board. Mount only while open. */
export function BoardNameDialog({
    title,
    initialName = '',
    submitLabel,
    pending,
    onSubmit,
    onClose,
}: BoardNameDialogProps) {
    const t = useTranslations('boards');
    const tc = useTranslations('common');
    const [name, setName] = useState(initialName);
    const parsed = boardNameSchema.safeParse(name);

    return (
        <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    if (parsed.success) onSubmit(parsed.data);
                }}
            >
                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    <CountedTextField
                        label={t('name')}
                        value={name}
                        onChange={setName}
                        maxLength={BOARD_NAME_MAX_LENGTH}
                        autoFocus
                        fullWidth
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={pending}>
                        {tc('cancel')}
                    </Button>
                    <Button type="submit" variant="contained" disabled={!parsed.success || pending}>
                        {submitLabel}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
