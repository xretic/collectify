import styles from './index.module.css';

/** Telegram-style "typing…" label with animated dots. */
export function TypingIndicator({ className }: { className?: string }) {
    return (
        <span className={`${styles.root} ${className ?? ''}`}>
            typing
            <span className={styles.dots} aria-hidden="true">
                <span />
                <span />
                <span />
            </span>
        </span>
    );
}
