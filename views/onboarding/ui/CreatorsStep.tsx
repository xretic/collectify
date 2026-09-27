'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import type { TopCreator } from '@/entities/user/model/types';
import { CreatorCard } from '@/entities/user/ui/CreatorCard';
import { FollowButton } from '@/features/user/follow/ui/FollowButton';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './OnboardingPage.module.css';
import { useTranslations } from 'next-intl';

type CreatorsStepProps = {
    categoryIds: number[];
    onFollowedChange: (userId: number, followed: boolean) => void;
};

/** Popular authors of the picked categories, so the first feed is not empty. */
export function CreatorsStep({ categoryIds, onFollowedChange }: CreatorsStepProps) {
    const t = useTranslations('onboarding');
    const queryClient = useQueryClient();
    const key = userQueryKeys.creators(categoryIds);
    const { data: creators, isPending } = useQuery({
        queryKey: key,
        queryFn: () => userApi.creators(categoryIds),
        staleTime: Infinity,
        // Optional step: after a failure show the fallback instead of spinning.
        retry: 1,
    });

    if (isPending) return <Spinner />;
    if (!creators?.length) return <EmptyState title={t('noCreators')} />;

    const setFollowed = (userId: number, followed: boolean) => {
        queryClient.setQueryData<TopCreator[]>(key, (list) =>
            list?.map((creator) =>
                creator.id === userId ? { ...creator, isFollowed: followed } : creator,
            ),
        );
        onFollowedChange(userId, followed);
    };

    return (
        <div className={styles.creators}>
            {creators.map((creator) => (
                <CreatorCard
                    key={creator.id}
                    creator={creator}
                    action={
                        <FollowButton
                            userId={creator.id}
                            isFollowed={creator.isFollowed}
                            size="small"
                            onChange={(followed) => setFollowed(creator.id, followed)}
                        />
                    }
                />
            ))}
        </div>
    );
}
