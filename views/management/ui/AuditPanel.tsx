'use client';

import { useRef } from 'react';
import styles from '@/app/management/management.module.css';
import { AuditAction } from '@/entities/management/api/managementApi';
import { formatDateTime } from '../lib/format';
import { formatAuditAction } from '../lib/audit';

type AuditPanelProps = {
    audit: AuditAction[];
    username: string;
    loading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
};

const SCROLL_THRESHOLD_PX = 120;

export function AuditPanel({ audit, username, loading, hasMore, onLoadMore }: AuditPanelProps) {
    const listRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        const el = listRef.current;
        if (!el || loading || !hasMore) return;

        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceFromBottom <= SCROLL_THRESHOLD_PX) onLoadMore();
    };

    return (
        <section className={styles.audit}>
            <h2 className={styles.subtitle}>Audit for @{username}</h2>
            <div className={styles.auditList} ref={listRef} onScroll={handleScroll}>
                {audit.length === 0 && !loading ? (
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
                {loading && <span className={styles.emptyState}>Loading...</span>}
            </div>
        </section>
    );
}
