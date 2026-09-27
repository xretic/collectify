import type { ReactNode } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import styles from './index.module.css';

type EmailNoticeProps = {
    icon: SvgIconComponent;
    title: string;
    children?: ReactNode;
    /** Buttons / links under the text. */
    actions?: ReactNode;
    tone?: 'accent' | 'danger';
};

/** Result card of the email flows ("Check your inbox", "Email confirmed"...). */
export function EmailNotice({
    icon: Icon,
    title,
    children,
    actions,
    tone = 'accent',
}: EmailNoticeProps) {
    return (
        <div className={styles.notice} role="status">
            <span className={`${styles.icon} ${styles[tone]}`}>
                <Icon />
            </span>
            <h2 className={styles.title}>{title}</h2>
            {children && <div className={styles.text}>{children}</div>}
            {actions && <div className={styles.actions}>{actions}</div>}
        </div>
    );
}
