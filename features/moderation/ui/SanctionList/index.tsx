'use client';

import { Button } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import type { ActiveSanction } from '@/entities/sanction/model/types';
import { formatSanction } from '@/entities/sanction/lib/format';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useModerationMutation } from '@/entities/moderation/model/useModerationMutation';
import styles from './index.module.css';

export function SanctionList({ sanctions }: { sanctions: ActiveSanction[] }) {
    const revoke = useModerationMutation(managementApi.revokeSanction, 'Sanction lifted.');

    if (sanctions.length === 0) return <EmptyState title="No active sanctions" />;

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
                        Lift
                    </Button>
                </li>
            ))}
        </ul>
    );
}
