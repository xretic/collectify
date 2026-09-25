'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import InterestsIcon from '@mui/icons-material/Interests';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { EditProfileDialog } from '@/features/user/edit-profile/ui/EditProfileDialog';
import { ChangePasswordForm } from '@/features/user/change-password/ui/ChangePasswordForm';
import { DeleteAccountButton } from '@/features/user/delete-account/ui/DeleteAccountButton';
import { ThemePicker } from '@/features/theme/ui/ThemePicker';
import { InterestsEditor } from '@/features/interest/ui/InterestsEditor';
import { PeopleWidgetToggle } from '@/widgets/people-you-may-know/ui/PeopleWidgetToggle';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './SettingsPage.module.css';

type SectionProps = {
    icon: ReactNode;
    title: string;
    description?: string;
    danger?: boolean;
    children: ReactNode;
};

function Section({ icon, title, description, danger = false, children }: SectionProps) {
    return (
        <section className={`${styles.section} ${danger ? styles.danger : ''}`}>
            <h2 className={styles.sectionTitle}>
                {icon}
                {title}
            </h2>
            {description && <p className={styles.sectionDescription}>{description}</p>}
            <div className={styles.sectionBody}>{children}</div>
        </section>
    );
}

export default function SettingsPage() {
    const { user, loading } = useSessionUser();
    const [editingProfile, setEditingProfile] = useState(false);

    if (loading || !user) return <Spinner variant="page" />;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>Manage your account settings and preferences</p>
            </header>

            <Section
                icon={<PersonIcon className={styles.icon} />}
                title="Profile"
                description="Name, username, bio and images."
            >
                <Button variant="contained" onClick={() => setEditingProfile(true)}>
                    Edit profile
                </Button>
            </Section>

            <Section
                icon={<KeyOutlinedIcon className={styles.icon} />}
                title="Privacy & Security"
                description={
                    user.hasPassword
                        ? 'Change your password.'
                        : 'Set a password to also sign in with email.'
                }
            >
                <ChangePasswordForm hasPassword={user.hasPassword} />
            </Section>

            <Section
                icon={<InterestsIcon className={styles.icon} />}
                title="Interests"
                description="Categories you like. They shape your “For you” feed."
            >
                <InterestsEditor />
            </Section>

            <Section
                icon={<ColorLensIcon className={styles.icon} />}
                title="Appearance"
                description="Pick a theme. It applies instantly and is remembered on this device."
            >
                <ThemePicker />
            </Section>

            <Section
                icon={<HomeOutlinedIcon className={styles.icon} />}
                title="Home page"
                description="Widgets next to your feed."
            >
                <PeopleWidgetToggle />
            </Section>

            <Section
                icon={<ShieldOutlinedIcon className={styles.dangerIcon} />}
                title="Danger zone"
                description="Permanently delete your account and all data."
                danger
            >
                <DeleteAccountButton user={user} />
            </Section>

            {editingProfile && (
                <EditProfileDialog open user={user} onClose={() => setEditingProfile(false)} />
            )}
        </div>
    );
}
