'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { useModerationMutation } from '@/entities/moderation/model/useModerationMutation';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type UserDangerZoneProps = {
    userId: number;
    username: string;
    onDeleted: () => void;
};

/** Admin-only: impersonate or delete an account. */
export function UserDangerZone({ userId, username, onDeleted }: UserDangerZoneProps) {
    const t = useTranslations('management.danger');
    const tc = useTranslations('common');
    const queryClient = useQueryClient();
    const [confirm, setConfirm] = useState<'impersonate' | 'delete' | null>(null);

    const impersonate = useModerationMutation(() => managementApi.impersonate(userId));
    const remove = useModerationMutation(() => managementApi.deleteUser(userId), t('deleted'));

    const handleImpersonate = () =>
        impersonate.mutate(undefined, {
            onSuccess: () => {
                queryClient.clear();
                queryClient.invalidateQueries({ queryKey: sessionUserQueryKey });
                window.location.assign('/');
            },
        });

    const handleDelete = () =>
        remove.mutate(undefined, {
            onSuccess: () => {
                setConfirm(null);
                onDeleted();
            },
        });

    return (
        <div className={styles.zone}>
            <Button
                variant="contained"
                startIcon={<LoginOutlinedIcon />}
                onClick={() => setConfirm('impersonate')}
            >
                {t('impersonate')}
            </Button>
            <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlinedIcon />}
                onClick={() => setConfirm('delete')}
            >
                {t('delete')}
            </Button>

            <ConfirmDialog
                open={confirm === 'impersonate'}
                title={t('impersonateTitle', { username })}
                description={t('impersonateDescription')}
                confirmLabel={t('signIn')}
                pending={impersonate.isPending}
                onClose={() => setConfirm(null)}
                onConfirm={handleImpersonate}
            />

            <ConfirmDialog
                open={confirm === 'delete'}
                title={t('deleteTitle', { username })}
                description={t('deleteDescription')}
                confirmLabel={tc('delete')}
                destructive
                pending={remove.isPending}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
