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
                            bio/description, country and city, and date of birth
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
                <h2 className={styles.sectionTitle}>Location and date of birth</h2>
                <div className={styles.text}>
                    Both are optional and can be changed or removed at any time in your profile.
                    <ul>
                        <li>
                            <strong>Country and city</strong> are shown on your public profile and
                            are used to suggest people you may know who live in the same city. We do
                            not collect your precise location or IP-based location.
                        </li>
                        <li>
                            <strong>Date of birth</strong> is private: it is never shown to other
                            users. It is used only to confirm that you meet the minimum age.
                        </li>
                    </ul>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Recommendations</h2>
                <p className={styles.text}>
                    To build your &ldquo;For you&rdquo; feed, board suggestions and &ldquo;People
                    you may know&rdquo;, we use the categories you pick as interests, the
                    collections you like, save, put on boards or open while signed in, the tags and
                    categories of those collections, the people you follow and who follow you, and
                    the city in your profile. We remember which collections you have liked or saved
                    even after you undo it, so they are not suggested to you again. This happens
                    inside Collectify only; boards and your viewing history are never shown to other
                    users.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Minimum age</h2>
                <p className={styles.text}>
                    Collectify is intended for people who are 18 or older. A date of birth that
                    makes you younger than 18 cannot be saved. If we learn that an account belongs
                    to someone under 18, we may suspend it and delete its data.
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
                    When you report content, we keep a copy of the reported comment or collection so
                    moderators can review it even if it is later deleted. Moderators and
                    administrators may review reported content and an account&apos;s public activity
                    when handling a report. Direct messages cannot be reported, and moderators and
                    administrators cannot read your conversations. Moderation actions are recorded
                    in an internal audit log. When an account is deleted, its content is deleted
                    too; the audit log keeps only the account ID and username.
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
