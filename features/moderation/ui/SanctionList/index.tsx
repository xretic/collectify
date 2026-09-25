'use client';

import { Button } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import type { ActiveSanction } from '@/entities/sanction/model/types';
import { useFormatSanction } from '@/entities/sanction/lib/format';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useModerationMutation } from '@/entities/moderation/model/useModerationMutation';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

export function SanctionList({ sanctions }: { sanctions: ActiveSanction[] }) {
    const t = useTranslations('management.sanctions');
    const formatSanction = useFormatSanction();
    const revoke = useModerationMutation(managementApi.revokeSanction, t('lifted'));

    if (sanctions.length === 0) return <EmptyState title={t('none')} />;

    return (
        <ul className={styles.list}>
            {sanctions.map((sanction) => (
                <li key={sanction.id} className={styles.row}>
                    <span>
                        {formatSanction(sanction)}
                        {sanction.reason && (
                            <span className={styles.reason}> — {sanction.reason}</span>
                        )}
                    </span>

                    <Button
                        size="small"
                        variant="outlined"
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(sanction.id)}
                    >
                        {t('lift')}
                    </Button>
                </li>
            ))}
        </ul>
    );
}
