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
import TranslateIcon from '@mui/icons-material/Translate';
import { useTranslations } from 'next-intl';
import { LanguageSelect } from '@/features/locale/ui/LanguageSelect';

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
    const t = useTranslations('settings');
    const { user, loading } = useSessionUser();
    const [editingProfile, setEditingProfile] = useState(false);

    if (loading || !user) return <Spinner variant="page" />;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('title')}</h1>
                <p className={styles.subtitle}>{t('subtitle')}</p>
            </header>

            <Section
                icon={<PersonIcon className={styles.icon} />}
                title={t('profile.title')}
                description={t('profile.description')}
            >
                <Button variant="contained" onClick={() => setEditingProfile(true)}>
                    {t('profile.edit')}
                </Button>
            </Section>

            <Section
                icon={<KeyOutlinedIcon className={styles.icon} />}
                title={t('security.title')}
                description={
                    user.hasPassword ? t('security.changePassword') : t('security.setPassword')
                }
            >
                <ChangePasswordForm hasPassword={user.hasPassword} />
            </Section>

            <Section
                icon={<InterestsIcon className={styles.icon} />}
                title={t('interests.title')}
                description={t('interests.description')}
            >
                <InterestsEditor />
            </Section>

            <Section
                icon={<TranslateIcon className={styles.icon} />}
                title={t('language.title')}
                description={t('language.description')}
            >
                <LanguageSelect />
            </Section>

            <Section
                icon={<ColorLensIcon className={styles.icon} />}
                title={t('appearance.title')}
                description={t('appearance.description')}
            >
                <ThemePicker />
            </Section>

            <Section
                icon={<HomeOutlinedIcon className={styles.icon} />}
                title={t('home.title')}
                description={t('home.description')}
            >
                <PeopleWidgetToggle />
            </Section>

            <Section
                icon={<ShieldOutlinedIcon className={styles.dangerIcon} />}
                title={t('danger.title')}
                description={t('danger.description')}
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
