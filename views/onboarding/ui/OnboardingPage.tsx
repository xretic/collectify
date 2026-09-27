'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { useCategories } from '@/entities/category/model/useCategories';
import { InterestPicker } from '@/features/interest/ui/InterestPicker';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { safeNextPath } from '@/shared/lib/safeNextPath';
import { CreatorsStep } from './CreatorsStep';
import { ideasFor, StartStep, type CollectionIdea } from './StartStep';
import styles from './OnboardingPage.module.css';
import { useTranslations } from 'next-intl';

const SUGGESTED_MINIMUM = 3;
const STEPS = ['interests', 'creators', 'start'] as const;

/** After sign-up: interests → people to follow → a first collection, so the feed starts full. */
export default function OnboardingPage() {
    const t = useTranslations('onboarding');
    const tc = useTranslations('common');
    const router = useRouter();
    const queryClient = useQueryClient();
    const { categories } = useCategories();
    const [step, setStep] = useState(0);
    const [selected, setSelected] = useState<number[]>([]);
    const [followed, setFollowed] = useState<Set<number>>(new Set());
    const [idea, setIdea] = useState<CollectionIdea | null>(null);
    // The page a guest was on when they decided to sign up.
    const next = safeNextPath(useSearchParams().get('next'));

    const ideas = useMemo(() => {
        const slugs = categories
            .filter((category) => selected.includes(category.id))
            .map((category) => category.slug);
        return ideasFor(slugs);
    }, [categories, selected]);
    const chosenIdea = idea ?? ideas[0];

    const saveInterests = useMutation({
        mutationFn: () => userApi.setInterests(selected),
        onSuccess: (categoryIds) => {
            queryClient.setQueryData(userQueryKeys.interests(), categoryIds);
            setStep(1);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const finish = (href: string) => {
        // Interests and follows shape "For you": start it from scratch.
        queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
        router.replace(href);
    };

    const createHref = () => {
        const params = new URLSearchParams({ name: t(`ideas.${chosenIdea.key}`) });
        if (chosenIdea.categorySlug) params.set('category', chosenIdea.categorySlug);
        return `/collections/create?${params}`;
    };

    const missing = Math.max(0, SUGGESTED_MINIMUM - selected.length);
    const key = STEPS[step];

    return (
        <section className={styles.page}>
            <ol
                className={styles.progress}
                aria-label={t('progress', { step: step + 1, total: STEPS.length })}
            >
                {STEPS.map((name, index) => (
                    <li
                        key={name}
                        className={`${styles.segment} ${index <= step ? styles.segmentDone : ''}`}
                        aria-current={index === step ? 'step' : undefined}
                    />
                ))}
            </ol>

            <header className={styles.header}>
                <h1 className={styles.title}>{t(`steps.${key}.title`)}</h1>
                <p className={styles.subtitle}>{t(`steps.${key}.subtitle`)}</p>
            </header>

            {key === 'interests' && <InterestPicker value={selected} onChange={setSelected} />}

            {key === 'creators' && (
                <CreatorsStep
                    categoryIds={selected}
                    onFollowedChange={(userId, value) =>
                        setFollowed((current) => {
                            const updated = new Set(current);
                            if (value) updated.add(userId);
                            else updated.delete(userId);
                            return updated;
                        })
                    }
                />
            )}

            {key === 'start' && (
                <StartStep ideas={ideas} selected={chosenIdea} onSelect={setIdea} />
            )}

            <footer className={styles.footer}>
                {step > 0 && (
                    <Button onClick={() => setStep(step - 1)} className={styles.back}>
                        {tc('back')}
                    </Button>
                )}

                {key === 'interests' && (
                    <>
                        <Button onClick={() => setStep(1)} disabled={saveInterests.isPending}>
                            {tc('skip')}
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => saveInterests.mutate()}
                            disabled={selected.length === 0 || saveInterests.isPending}
                        >
                            {missing > 0 ? t('pickMore', { count: missing }) : t('continue')}
                        </Button>
                    </>
                )}

                {key === 'creators' && (
                    <Button variant="contained" size="large" onClick={() => setStep(2)}>
                        {followed.size > 0 ? t('continue') : tc('skip')}
                    </Button>
                )}

                {key === 'start' && (
                    <>
                        <Button onClick={() => finish(next)}>{t('toFeed')}</Button>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => finish(createHref())}
                        >
                            {t('createFirst')}
                        </Button>
                    </>
                )}
            </footer>
        </section>
    );
}
