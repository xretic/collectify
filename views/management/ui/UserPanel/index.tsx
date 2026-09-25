'use client';

import Link from 'next/link';
import { Avatar, Chip } from '@mui/material';
import { useFormatSanction } from '@/entities/sanction/lib/format';
import { RoleToggles } from '@/features/moderation/ui/RoleToggles';
import { SanctionForm } from '@/features/moderation/ui/SanctionForm';
import { SanctionList } from '@/features/moderation/ui/SanctionList';
import { UserDangerZone } from '@/features/moderation/ui/UserDangerZone';
import { toast } from '@/shared/model/toastStore';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { ActivityHistory } from '../ActivityHistory';
import { useManagedUser } from '../../model/useManagedUser';
import { Section } from '../Section';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type UserPanelProps = {
    userId: number;
    isAdmin: boolean;
    onDeleted: () => void;
};

export function UserPanel({ userId, isAdmin, onDeleted }: UserPanelProps) {
    const t = useTranslations('management.user');
    const tRoles = useTranslations('roles');
    const tp = useTranslations('profile');
    const formatSanction = useFormatSanction();
    const { user, isPending } = useManagedUser(userId);

    if (isPending) return <Spinner />;
    if (!user) return <EmptyState title={t('notFound')} description={t('notFoundHint')} />;

    const copyUsername = async () => {
        await navigator.clipboard.writeText(user.username);
        toast.success(tp('usernameCopied'));
    };

    return (
        <>
            <header className={styles.header}>
                <Avatar src={user.avatarUrl} alt={user.username} className={styles.avatar} />
                <div>
                    <Link href={`/users/${user.id}`} target="_blank" className={styles.name}>
                        {user.fullName || user.username}
                    </Link>
                    <button
                        type="button"
                        className={styles.username}
                        onClick={copyUsername}
                        title={tp('copyUsername')}
                    >
                        @{user.username}
                    </button>
                    <p className={styles.email}>{user.email}</p>
                </div>
            </header>

            <div className={styles.chips}>
                {user.roles.length === 0 && (
                    <Chip size="small" label={t('regularUser')} variant="outlined" />
                )}
                {user.roles.map((role) => (
                    <Chip key={role} size="small" label={tRoles(role)} variant="outlined" />
                ))}
                {user.activeSanctions.map((sanction) => (
                    <Chip
                        key={sanction.id}
                        size="small"
                        color="error"
                        label={formatSanction(sanction)}
                    />
                ))}
            </div>

            <dl className={styles.stats}>
                {(['collections', 'comments', 'messages', 'reportsReceived'] as const).map(
                    (key) => (
                        <div key={key} className={styles.stat}>
                            <dt>{t(`stats.${key}`)}</dt>
                            <dd>{user.counts[key]}</dd>
                        </div>
                    ),
                )}
            </dl>

            <Section title={t('sanctions')} hint={t('sanctionsHint')}>
                <SanctionForm userId={user.id} username={user.username} isAdmin={isAdmin} />
                <SanctionList sanctions={user.activeSanctions} />
            </Section>

            <Section title={t('roles')} hint={t('rolesHint')}>
                <RoleToggles userId={user.id} roles={user.roles} isAdmin={isAdmin} />
            </Section>

            <Section title={t('activity')} hint={t('activityHint')}>
                <ActivityHistory userId={user.id} />
            </Section>

            {isAdmin && (
                <Section title={t('danger')}>
                    <UserDangerZone
                        userId={user.id}
                        username={user.username}
                        onDeleted={onDeleted}
                    />
                </Section>
            )}
        </>
    );
}
