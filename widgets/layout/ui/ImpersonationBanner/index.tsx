import styles from './index.module.css';

export function ImpersonationBanner({ username }: { username: string }) {
    return (
        <div className={styles.banner} role="status">
            You are signed in as <strong>@{username}</strong>. Use “Return to admin” in the account
            menu to go back.
        </div>
    );
}
