'use client';

import { useUser } from '@/context/UserProvider';
import { Avatar } from '@mui/material';

export default function HomePage() {
    const { user, loading } = useUser();

    if (loading) return null;

    return (
        <div>
            <div className="home-page-title">
                {user ? (
                    <>
                        <Avatar
                            src={user.avatarUrl}
                            alt={user.username}
                            sx={{ width: 45, height: 45 }}
                        />
                        <span>Welcome back, {user.username}!</span>
                    </>
                ) : (
                    <span>Discover collections</span>
                )}
            </div>
        </div>
    );
}
