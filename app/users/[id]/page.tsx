'use client';

import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';

export default function ProfilePage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { user, loading } = useUser();
    const [pageUser, setUser] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

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
        <header className="profile">
            {copied && (
                <div className={`toast ${copied ? 'show' : ''}`}>
                    <Alert severity="success" variant="filled">
                        Copied.
                    </Alert>
                </div>
            )}

            <div
                className={'profile-cover'}
                style={{ backgroundImage: `url(${pageUser.bannerUrl})` }}
            />

            <nav className="profile-nav-bar">
                <div className="profile-header">
                    <Avatar
                        className={'profile-avatar'}
                        src={pageUser.avatarUrl}
                        alt={pageUser.username}
                    />
                    <div className="profile-info">
                        <>
                            <h1 className="profile-name">{pageUser.fullName}</h1>
                            <span onClick={handleCopy} className="profile-username">
                                @{pageUser.username}
                            </span>
                            <p className="profile-description">
                                <FormatQuoteIcon />
                                {pageUser.description.length === 0
                                    ? 'No bio yet'
                                    : pageUser.description}
                            </p>
                        </>
                    </div>
                </div>
            </nav>
        </header>
    );
}
