import type { ReactNode } from 'react';
import styles from './index.module.css';

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className={styles.empty}>
            <span className={styles.title}>{title}</span>
            {description && <span>{description}</span>}
            {action && <div className={styles.action}>{action}</div>}
        </div>
    );
}
