'use client';

import { useUser } from '@/context/UserProvider';
import { useUIStore } from '@/stores/uiStore';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { Avatar } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';

export default function CollectionPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { user, loading } = useUser();
    const { startLoading, stopLoading } = useUIStore();
    const router = useRouter();

    const [collection, setCollection] = useState<CollectionPropsAdditional | null>(null);

    const loadCollectionData = async () => {
        startLoading();
        const response = await fetch('/api/collections/' + id);

        if (response.status === 200) {
            const data = await response.json();
            setCollection(data.data);
        } else {
            router.replace('/');
        }

        stopLoading();
    };

    useEffect(() => {
        loadCollectionData();
    }, [id]);

    if (loading) return null;

    return collection ? (
        <>
            <div className="collection-page-title-container">
                <span className="collection-page-title">{collection.name}</span>
                <span className="collection-page-category">{collection.category}</span>
                <Image
                    src={collection?.bannerUrl ?? '/'}
                    alt="Banner"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black/50 to-transparent pointer-events-none"></div>
                <Link href={'/users/' + collection.authorId} className="collection-page-author">
                    <Avatar
                        alt={collection.author}
                        src={collection.authorAvatarUrl}
                        sx={{ width: 30, height: 30 }}
                    >
                        {collection.author}
                    </Avatar>
                    <span>{collection.author}</span>
                </Link>

                <div>{collection.items.length}</div>
            </div>
            <div className="collection-page-description-container">
                <h1 className="collection-page-header">
                    <DescriptionIcon sx={{ width: 20, height: 20 }} />
                    Description
                </h1>
                <span className="collection-page-description">{collection.description}</span>
            </div>
        </>
    ) : null;
}
