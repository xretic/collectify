'use client';

import CollectionField from '@/components/CollectionField';
import { useUser } from '@/context/UserProvider';
import { PAGE_SIZE } from '@/lib/constans';
import { useUIStore } from '@/stores/uiStore';
import { Avatar } from '@mui/material';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const { user, loading } = useUser();

    const [collections, setCollections] = useState<any[]>([]);
    const [pagination, setPagination] = useState(0);
    const [sortedBy, setSortedBy] = useState('newest');
    const [category, setCategory] = useState('');
    const { startLoading, stopLoading, loadingCount } = useUIStore();

    useEffect(() => {
        const loadCollections = async () => {
            startLoading();

            const userPrompt = user ? `&userId=${user.id}` : '';
            const categoryPrompt = category !== '' ? `&category=${category}` : '';

            const response = await fetch(
                `/api/collections/search/?sortedBy=${sortedBy}&skip=${pagination * PAGE_SIZE}` +
                    categoryPrompt +
                    userPrompt,
            );

            const data = await response.json();

            setCollections([...collections, ...data.data]);

            stopLoading();
        };

        loadCollections();
    }, [user, pagination, sortedBy, category]);

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

            {collections.length > 0 ? (
                collections.map((x) => (
                    <CollectionField
                        key={x.id}
                        id={x.id}
                        author={x.author}
                        authorAvatarUrl={x.authorAvatarUrl}
                        bannerUrl={x.bannerUrl}
                        name={x.name}
                        category={x.category}
                        likes={x.likes}
                        addedToFavorite={x.addedToFavorite}
                        items={x.items}
                    />
                ))
            ) : (
                <></>
            )}
        </div>
    );
}
