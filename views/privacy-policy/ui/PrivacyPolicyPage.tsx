import styles from './PrivacyPolicyPage.module.css';

export default function PrivacyPolicyPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.updated}>Last updated: September 24, 2026</p>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>What data we collect</h2>
                <div className={styles.text}>
                    When you create an account on Collectify, we collect:
                    <ul>
                        <li>Your email address (used to sign in and identify your account)</li>
                        <li>A username and full name you choose</li>
                        <li>
                            A password (stored as a secure hash — we never store your password in
                            plain text), unless you sign up via GitHub or Google, in which case we
                            store a linked account ID instead
                        </li>
                        <li>
                            Optional profile info you add: avatar image, banner image,
                            bio/description
                        </li>
                        <li>
                            Content you create while using the app: collections, items, comments,
                            likes, follows, messages, and notifications
                        </li>
                    </ul>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Why we collect it</h2>
                <p className={styles.text}>
                    Your data is used to create and manage your account, authenticate you when you
                    log in, keep you signed in between visits (session management), and to provide
                    the core features of the app — collections, following other users, comments,
                    likes, and messaging.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Cookies</h2>
                <p className={styles.text}>
                    We use a functional session cookie to keep you signed in, and a short-lived
                    security cookie (about 10 minutes) while you sign in with GitHub or Google. Your
                    light/dark theme choice is saved in your browser&apos;s local storage. We do not
                    use analytics, tracking, or marketing cookies.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Where your data is stored</h2>
                <p className={styles.text}>
                    The app is hosted on Vercel. Account and content data is stored in our database.
                    Uploaded images (avatars, banners, item images) are stored with our media
                    hosting provider, Uploadcare.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Reports and moderation</h2>
                <p className={styles.text}>
                    When you report content, we keep a copy of the reported message, comment or
                    collection so moderators can review it even if it is later deleted. Moderators
                    and administrators may review reported content, the surrounding messages of a
                    reported conversation, and an account&apos;s activity when handling a report.
                    Moderation actions are recorded in an internal audit log. When an account is
                    deleted, its content is deleted too; the audit log keeps only the account ID and
                    username.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Third parties</h2>
                <p className={styles.text}>
                    We do not sell or share your data with third parties for advertising or
                    marketing purposes. If you choose to sign up or log in with GitHub or Google,
                    those providers share basic profile information (such as your email) with us to
                    create your account.
                </p>
            </section>
        </div>
    );
}
