'use client';

import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import CollectionsWrapper from '@/components/CollectionsWrapper/CollectionsWrapper';
import SortBy from '@/components/SortBy/SortBy';
import CollectionSearchBar from '@/components/CollectionSearchBar/CollectionSearchBar';
import { useDebounce } from '@/lib/useDebounce';
import { useUIStore } from '@/stores/uiStore';
import { PAGE_SIZE } from '@/lib/constans';
import { usePaginationStore } from '@/stores/paginationStore';
import { useCollectionSearchStore } from '@/stores/collectionSearchStore';
import styles from '../users.module.css';

export default function ProfilePage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [collections, setCollections] = useState<any[]>([]);
    const { user, loading } = useUser();
    const [pageUser, setUser] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const { startLoading, stopLoading, sortedBy } = useUIStore();
    const { profilePagination } = usePaginationStore();
    const { query } = useCollectionSearchStore();

    const debouncedSortedBy = useDebounce(sortedBy, 400);
    const debouncedPagination = useDebounce(profilePagination, 400);
    const debouncedQuery = useDebounce(query, 400);

    const queryParam = debouncedQuery.trim() === '' ? '' : `&query=${debouncedQuery}`;

    const router = useRouter();

    const loadCollections = async () => {
        startLoading();

        const response = await fetch(
            `/api/collections/search/?skip=${profilePagination * PAGE_SIZE}&sortedBy=${sortedBy}${queryParam}&authorId=${id}`,
        );

        if (response.status === 200) {
            const data = await response.json();

            setCollections(data.data);
        }

        stopLoading();
    };

    useEffect(() => {
        loadCollections();
    }, [loading, debouncedQuery, debouncedPagination, debouncedSortedBy]);

    useEffect(() => {
        const loadUser = async () => {
            const res = await fetch('/api/users/' + id);
            const data = await res.json();
            setUser(data.user);
        };

        loadUser();
    }, [id]);

    useEffect(() => {
        if (user && pageUser && user.id === pageUser.id) {
            router.replace('/users/me');
        }
    }, [user, pageUser, router]);

    if (loading) return null;
    if (!pageUser) return null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(pageUser.username);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <header className={styles.profile}>
            {copied && (
                <div className={`toast ${copied ? 'show' : ''}`}>
                    <Alert severity="success" variant="filled">
                        Copied.
                    </Alert>
                </div>
            )}

            <div
                className={styles.cover}
                style={{ backgroundImage: `url(${pageUser.bannerUrl})` }}
            />

            <nav className={styles['nav-bar']}>
                <div className={styles.header}>
                    <Avatar
                        className={styles.avatar}
                        src={pageUser.avatarUrl}
                        alt={pageUser.username}
                    />
                    <div className={styles.info}>
                        <>
                            <h1 className={styles['name']}>{pageUser.fullName}</h1>
                            <span onClick={handleCopy} className={styles['username']}>
                                @{pageUser.username}
                            </span>
                            <p className={styles['description']}>
                                <FormatQuoteIcon />
                                {pageUser.description.length === 0
                                    ? 'No bio yet'
                                    : pageUser.description}
                            </p>
                        </>
                    </div>
                </div>
            </nav>

            <div className={styles['collections-category']}>
                <CollectionSearchBar disabled={debouncedQuery === '' && collections.length === 0} />
                <SortBy className="collections-search" disabled={collections.length === 0} />
            </div>

            <div className={styles['before-collections-line']} />

            <div className={styles['collections-wrapper']}>
                <CollectionsWrapper collections={collections} page="profile" />
            </div>
        </header>
    );
}
