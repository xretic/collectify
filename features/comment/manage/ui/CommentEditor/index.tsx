'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import { COMMENT_MAX_LENGTH } from '@/shared/lib/constants';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type CommentEditorProps = {
    initialText: string;
    pending: boolean;
    onSave: (text: string) => void;
    onCancel: () => void;
};

export function CommentEditor({ initialText, pending, onSave, onCancel }: CommentEditorProps) {
    const t = useTranslations('common');
    const [text, setText] = useState(initialText);
    const trimmed = text.trim();

    return (
        <div className={styles.editor}>
            <CountedTextField
                value={text}
                onChange={setText}
                maxLength={COMMENT_MAX_LENGTH}
                multiline
                minRows={1}
                maxRows={12}
                size="small"
                fullWidth
                autoFocus
            />

            <div className={styles.actions}>
                <Button onClick={onCancel} disabled={pending}>
                    {t('cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => (trimmed === initialText ? onCancel() : onSave(trimmed))}
                    disabled={!trimmed || pending}
                >
                    {t('save')}
                </Button>
            </div>
        </div>
    );
}
