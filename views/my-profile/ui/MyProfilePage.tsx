'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { ProfileHeader } from '@/entities/user/ui/ProfileHeader';
import { ProfileStats } from '@/entities/user/ui/ProfileStats';
import { EditProfileDialog } from '@/features/user/edit-profile/ui/EditProfileDialog';
import { FollowListDialog } from '@/features/user/follow/ui/FollowListDialog';
import type { FollowListKind } from '@/entities/user/model/types';
import { ProfileCollections } from '@/widgets/profile-collections/ui/ProfileCollections';
import { Spinner } from '@/shared/ui/Spinner';
import { useTranslations } from 'next-intl';

export default function MyProfilePage() {
    const t = useTranslations('settings.profile');
    const { user, loading } = useSessionUser();
    const [editing, setEditing] = useState(false);
    const [followList, setFollowList] = useState<FollowListKind | null>(null);

    if (loading || !user) return <Spinner variant="page" />;

    return (
        <>
            <ProfileHeader
                user={user}
                stats={
                    <ProfileStats
                        followers={user.followers}
                        subscriptions={user.subscriptions}
                        variant="card"
                        onSelect={setFollowList}
                    />
                }
                actions={
                    <Tooltip title={t('edit')}>
                        <IconButton onClick={() => setEditing(true)} aria-label={t('edit')}>
                            <EditOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                }
            />

            <ProfileCollections
                authorId={user.id}
                stats={
                    <ProfileStats
                        followers={user.followers}
                        subscriptions={user.subscriptions}
                        onSelect={setFollowList}
                    />
                }
                own
            />

            {editing && <EditProfileDialog open user={user} onClose={() => setEditing(false)} />}

            {followList && (
                <FollowListDialog
                    userId={user.id}
                    kind={followList}
                    onKindChange={setFollowList}
                    onClose={() => setFollowList(null)}
                />
            )}
        </>
    );
}
