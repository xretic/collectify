'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { Spinner } from '@/shared/ui/Spinner';
import { InterestPicker } from '../InterestPicker';
import styles from './index.module.css';

/** Settings section: edit the categories that seed recommendations. */
export function InterestsEditor() {
    const queryClient = useQueryClient();
    const saved = useQuery({ queryKey: userQueryKeys.interests(), queryFn: userApi.interests });
    const [draft, setDraft] = useState<number[] | null>(null);

    const save = useMutation({
        mutationFn: (categoryIds: number[]) => userApi.setInterests(categoryIds),
        onSuccess: (categoryIds) => {
            queryClient.setQueryData(userQueryKeys.interests(), categoryIds);
            queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
            setDraft(null);
            toast.success('Interests saved.');
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    if (!saved.data) return <Spinner />;

    const value = draft ?? saved.data;
    const changed = draft !== null;

    return (
        <div className={styles.editor}>
            <InterestPicker value={value} onChange={setDraft} />

            <div className={styles.actions}>
                <Button onClick={() => setDraft(null)} disabled={!changed || save.isPending}>
                    Reset
                </Button>
                <Button
                    variant="contained"
                    onClick={() => save.mutate(value)}
                    disabled={!changed || save.isPending}
                >
                    Save interests
                </Button>
            </div>
        </div>
    );
}
