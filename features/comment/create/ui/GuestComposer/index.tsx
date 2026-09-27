'use client';

import { Avatar } from '@mui/material';
import { promptSignIn } from '@/features/auth/model/authPromptStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Looks like the comment box; for guests it opens the sign-in dialog instead. */
export function GuestComposer() {
    const t = useTranslations('comments');

    return (
        <button type="button" className={styles.composer} onClick={() => promptSignIn('comment')}>
            <Avatar className={styles.avatar} />
            <span className={styles.field}>{t('guestPlaceholder')}</span>
        </button>
    );
}
