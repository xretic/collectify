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

type UserDangerZoneProps = {
    userId: number;
    username: string;
    onDeleted: () => void;
};

/** Admin-only: impersonate or delete an account. */
export function UserDangerZone({ userId, username, onDeleted }: UserDangerZoneProps) {
    const queryClient = useQueryClient();
    const [confirm, setConfirm] = useState<'impersonate' | 'delete' | null>(null);

    const impersonate = useModerationMutation(() => managementApi.impersonate(userId));
    const remove = useModerationMutation(
        () => managementApi.deleteUser(userId),
        'Account deleted.',
    );

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
                Sign in as user
            </Button>
            <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlinedIcon />}
                onClick={() => setConfirm('delete')}
            >
                Delete account
            </Button>

            <ConfirmDialog
                open={confirm === 'impersonate'}
                title={`Sign in as @${username}?`}
                description="Everything you do will be recorded in the audit log under your name."
                confirmLabel="Sign in"
                pending={impersonate.isPending}
                onClose={() => setConfirm(null)}
                onConfirm={handleImpersonate}
            />

            <ConfirmDialog
                open={confirm === 'delete'}
                title={`Delete @${username}?`}
                description="The account, its collections, comments and chats are deleted permanently."
                confirmLabel="Delete"
                destructive
                pending={remove.isPending}
                onClose={() => setConfirm(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
