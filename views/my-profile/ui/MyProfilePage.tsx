'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { ProfileHeader } from '@/entities/user/ui/ProfileHeader';
import { ProfileStats } from '@/entities/user/ui/ProfileStats';
import { EditProfileDialog } from '@/features/user/edit-profile/ui/EditProfileDialog';
import { ProfileCollections } from '@/widgets/profile-collections/ui/ProfileCollections';
import { Spinner } from '@/shared/ui/Spinner';

export default function MyProfilePage() {
    const { user, loading } = useSessionUser();
    const [editing, setEditing] = useState(false);

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
                    />
                }
                actions={
                    <Tooltip title="Edit profile">
                        <IconButton onClick={() => setEditing(true)} aria-label="Edit profile">
                            <EditOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                }
            />

            <ProfileCollections
                authorId={user.id}
                stats={
                    <ProfileStats followers={user.followers} subscriptions={user.subscriptions} />
                }
                own
            />

            {editing && <EditProfileDialog open user={user} onClose={() => setEditing(false)} />}
        </>
    );
}
