'use client';

import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useParams } from 'next/navigation';

export default function ProfilePage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [user, setUser] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            const res = await fetch('/api/users/' + id);
            const data = await res.json();
            setUser(data.user);
        };

        loadUser();
    }, [id]);

    if (!user) return null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(user.username);
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
                style={{ backgroundImage: `url(${user.bannerUrl})` }}
            />

            <nav className="profile-nav-bar">
                <div className="profile-header">
                    <Avatar className={'profile-avatar'} src={user.avatarUrl} alt={user.username} />
                    <div className="profile-info">
                        <>
                            <h1 className="profile-name">{user.fullName}</h1>
                            <span onClick={handleCopy} className="profile-username">
                                @{user.username}
                            </span>
                            <p className="profile-description">
                                <FormatQuoteIcon />
                                {user.description.length === 0 ? 'No bio yet' : user.description}
                            </p>
                        </>
                    </div>
                </div>
            </nav>
        </header>
    );
}
