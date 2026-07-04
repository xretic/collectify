'use client';

import styles from '@/app/management/management.module.css';
import { Button } from '@mui/material';
import { AuditAction } from '@/entities/management/api/managementApi';
import { formatDateTime } from '../lib/format';
import { formatAuditAction } from '../lib/audit';

type AuditPanelProps = {
    audit: AuditAction[];
    busy: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
};

export function AuditPanel({ audit, busy, hasMore, onLoadMore }: AuditPanelProps) {
    return (
        <section className={styles.audit}>
            <h2 className={styles.subtitle}>Audit</h2>
            <div className={styles.auditList}>
                {audit.length === 0 ? (
                    <span className={styles.emptyState}>No audit records yet</span>
                ) : (
                    audit.map((action) => (
                        <div key={action.id} className={styles.auditRow}>
                            <span className={styles.username}>
                                {formatAuditAction(action.action)}
                            </span>
                            <span className={styles.muted}>
                                {action.actor?.username ?? 'system'}
                                {' -> '}
                                {action.targetUser?.username ?? 'content'}
                                {' | '}
                                {formatDateTime(action.createdAt)}
                            </span>
                        </div>
                    ))
                )}

                {hasMore && (
                    <Button
                        variant="text"
                        size="small"
                        disabled={busy}
                        onClick={onLoadMore}
                        sx={{ textTransform: 'none' }}
                    >
                        Load more
                    </Button>
                )}
            </div>
        </section>
    );
}
