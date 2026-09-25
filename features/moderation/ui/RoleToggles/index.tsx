'use client';

import { Button } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import type { UserRole } from '@/entities/user/model/types';
import { useModerationMutation } from '@/entities/moderation/model/useModerationMutation';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type ManageableRole = 'Moderator' | 'Verified';

type RoleTogglesProps = {
    userId: number;
    roles: UserRole[];
    isAdmin: boolean;
};

/** The Admin role is not managed here: see `npm run admin`. */
export function RoleToggles({ userId, roles, isAdmin }: RoleTogglesProps) {
    const t = useTranslations('management.roles');
    const tr = useTranslations('roles');
    const setRole = useModerationMutation(
        ({ role, enabled }: { role: ManageableRole; enabled: boolean }) =>
            managementApi.setRole(userId, role, enabled, ''),
        t('updated'),
    );

    return (
        <div className={styles.roles}>
            {(['Verified', 'Moderator'] as const).map((role) => {
                const enabled = roles.includes(role);

                return (
                    <Button
                        key={role}
                        variant={enabled ? 'outlined' : 'contained'}
                        disabled={setRole.isPending || (role === 'Moderator' && !isAdmin)}
                        onClick={() => setRole.mutate({ role, enabled: !enabled })}
                    >
                        {enabled ? t('revoke', { role: tr(role) }) : t('grant', { role: tr(role) })}
                    </Button>
                );
            })}
        </div>
    );
}
