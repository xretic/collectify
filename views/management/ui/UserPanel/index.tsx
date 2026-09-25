'use client';

import Link from 'next/link';
import { Avatar, Chip } from '@mui/material';
import { formatSanction } from '@/entities/sanction/lib/format';
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

type UserPanelProps = {
    userId: number;
    isAdmin: boolean;
    onDeleted: () => void;
};

export function UserPanel({ userId, isAdmin, onDeleted }: UserPanelProps) {
    const { user, isPending } = useManagedUser(userId);

    if (isPending) return <Spinner />;
    if (!user)
        return (
            <EmptyState
                title="User not found"
                description="They may have been deleted, or you cannot manage them."
            />
        );

    const copyUsername = async () => {
        await navigator.clipboard.writeText(user.username);
        toast.success('Username copied.');
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
                        title="Copy username"
                    >
                        @{user.username}
                    </button>
                    <p className={styles.email}>{user.email}</p>
                </div>
            </header>

            <div className={styles.chips}>
                {user.roles.length === 0 && <Chip size="small" label="User" variant="outlined" />}
                {user.roles.map((role) => (
                    <Chip key={role} size="small" label={role} variant="outlined" />
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
                {[
                    ['Collections', user.counts.collections],
                    ['Comments', user.counts.comments],
                    ['Messages', user.counts.messages],
                    ['Reports received', user.counts.reportsReceived],
                ].map(([label, value]) => (
                    <div key={label} className={styles.stat}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                    </div>
                ))}
            </dl>

            <Section
                title="Sanctions"
                hint="Bans and feature-specific mutes. A stronger active sanction is never shortened."
            >
                <SanctionForm userId={user.id} username={user.username} isAdmin={isAdmin} />
                <SanctionList sanctions={user.activeSanctions} />
            </Section>

            <Section title="Roles" hint="Admin rights are managed with `npm run admin`.">
                <RoleToggles userId={user.id} roles={user.roles} isAdmin={isAdmin} />
            </Section>

            <Section title="Activity" hint="Collections and comments, newest first.">
                <ActivityHistory userId={user.id} />
            </Section>

            {isAdmin && (
                <Section title="Danger zone">
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
