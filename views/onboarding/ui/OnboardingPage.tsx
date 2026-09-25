'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { InterestPicker } from '@/features/interest/ui/InterestPicker';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './OnboardingPage.module.css';

const SUGGESTED_MINIMUM = 3;

/** First step after sign-up: pick categories to seed the "For you" feed. */
export default function OnboardingPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selected, setSelected] = useState<number[]>([]);

    const save = useMutation({
        mutationFn: () => userApi.setInterests(selected),
        onSuccess: (categoryIds) => {
            queryClient.setQueryData(userQueryKeys.interests(), categoryIds);
            queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
            router.replace('/');
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const missing = Math.max(0, SUGGESTED_MINIMUM - selected.length);

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>What are you into?</h1>
                <p className={styles.subtitle}>
                    Pick a few categories and we&apos;ll tailor your feed. You can change them later
                    in settings.
                </p>
            </header>

            <InterestPicker value={selected} onChange={setSelected} />

            <footer className={styles.footer}>
                <Button onClick={() => router.replace('/')} disabled={save.isPending}>
                    Skip
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => save.mutate()}
                    disabled={selected.length === 0 || save.isPending}
                >
                    {missing > 0 ? `Pick ${missing} more` : 'Continue'}
                </Button>
            </footer>
        </section>
    );
}
