'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { IconButton, Tooltip } from '@mui/material';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { ProfileHeader } from '@/entities/user/ui/ProfileHeader';
import { ProfileStats } from '@/entities/user/ui/ProfileStats';
import type { FollowListKind, PublicUser, SessionUser } from '@/entities/user/model/types';
import { FollowButton } from '@/features/user/follow/ui/FollowButton';
import { FollowListDialog } from '@/features/user/follow/ui/FollowListDialog';
import { MessageButton } from '@/features/chat/create/ui/MessageButton';
import { ReportButton } from '@/features/report/create/ui/ReportButton';
import { ProfileCollections } from '@/widgets/profile-collections/ui/ProfileCollections';
import { Spinner } from '@/shared/ui/Spinner';

function canManage(viewer: SessionUser | null, target: PublicUser) {
    if (!viewer || viewer.id === target.id || target.roles.includes('Admin')) return false;
    if (viewer.roles.includes('Admin')) return true;
    return viewer.roles.includes('Moderator') && !target.roles.includes('Moderator');
}

export default function UserProfilePage() {
    const router = useRouter();
    const userId = Number(useParams<{ id: string }>().id);
    const { user: viewer } = useSessionUser();
    const [followList, setFollowList] = useState<FollowListKind | null>(null);

    const {
        data: profile,
        error,
        isPending,
    } = useQuery({
        queryKey: userQueryKeys.detail(userId),
        queryFn: () => userApi.getById(userId),
        enabled: Number.isInteger(userId) && userId > 0,
        retry: false,
    });

    const isSelf = viewer !== null && viewer.id === userId;

    useEffect(() => {
        if (isSelf) router.replace('/users/me');
    }, [isSelf, router]);

    if (!Number.isInteger(userId) || userId <= 0) notFound();
    if (error instanceof HTTPError && error.response.status === 404) notFound();
    if (isPending || !profile || isSelf) return <Spinner variant="page" />;

    const signedIn = viewer !== null;

    return (
        <>
            <ProfileHeader
                user={profile}
                stats={
                    <ProfileStats
                        followers={profile.followers}
                        subscriptions={profile.subscriptions}
                        variant="card"
                        onSelect={setFollowList}
                    />
                }
                actions={
                    <>
                        <FollowButton user={profile} disabled={!signedIn} />
                        <MessageButton recipient={profile} disabled={!signedIn} />
                        <ReportButton
                            target={{ type: 'USER', userId: profile.id }}
                            username={profile.username}
                            disabled={!signedIn}
                        />
                        {canManage(viewer, profile) && (
                            <Tooltip title="Manage">
                                <IconButton
                                    color="inherit"
                                    component={Link}
                                    href={`/management?userId=${profile.id}`}
                                >
                                    <AdminPanelSettingsOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </>
                }
            />

            <ProfileCollections
                authorId={profile.id}
                stats={
                    <ProfileStats
                        followers={profile.followers}
                        subscriptions={profile.subscriptions}
                        onSelect={setFollowList}
                    />
                }
            />

            {followList && (
                <FollowListDialog
                    userId={profile.id}
                    kind={followList}
                    onKindChange={setFollowList}
                    onClose={() => setFollowList(null)}
                />
            )}
        </>
    );
}
