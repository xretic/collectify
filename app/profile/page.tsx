'use client';

import { useUser } from '@/context/UserProvider';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Button, Input } from 'antd';
import { useState } from 'react';

export default function ProfilePage() {
    const { user, loading, setUser } = useUser();
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [description, setDescription] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    if (loading) return null;

    if (!user) {
        return (
            <div className={`toast ${copied ? 'show' : ''}`}>
                <Alert severity="error" variant="filled">
                    Something went wrong.
                </Alert>
            </div>
        );
    }

    const handleEdit = () => {
        setFullName(user.fullName);
        setDescription(user.description);
        setBannerUrl(user.bannerUrl);
        setAvatarUrl(user.avatarUrl);
        setEditing(true);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(user.username);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const waitForUploadcare = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100;

            const interval = setInterval(() => {
                if ((window as any).uploadcare) {
                    clearInterval(interval);
                    resolve((window as any).uploadcare);
                } else if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('Uploadcare failed to load.'));
                }
            }, 100);
        });
    };

    const handleUpload = async (setUrl: (url: string) => void) => {
        try {
            const uploadcare = await waitForUploadcare();

            uploadcare
                .openDialog(null, {
                    imagesOnly: true,
                    multiple: false,
                    crop: 'free',
                })
                .done((file: any) => {
                    file.done((info: any) => {
                        setUrl(info.cdnUrl);
                    });
                });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        const res = await fetch('/api/admin/users/' + user.id, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullName,
                description,
                bannerUrl,
                avatarUrl,
            }),
        });

        if (!res.ok) {
            console.error('Failed to update user');
            return;
        }

        const updatedUser = await res.json();

        setUser(updatedUser.user);
        setEditing(false);
    };

    const handleCancel = () => {
        setEditing(false);
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
                onClick={editing ? () => handleUpload(setBannerUrl) : () => {}}
                className={editing ? 'profile-cover-editing' : 'profile-cover'}
                style={{ backgroundImage: `url(${editing ? bannerUrl : user.bannerUrl})` }}
            />

            <nav className="profile-nav-bar">
                {!editing && (
                    <Button
                        className="profile-action-btn"
                        onClick={handleEdit}
                        shape="circle"
                        icon={<EditOutlinedIcon />}
                    />
                )}

                {editing && (
                    <>
                        <Button
                            style={{
                                backgroundColor: '#52c41a',
                                borderColor: '#52c41a',
                                color: 'black',
                            }}
                            shape="circle"
                            icon={<CheckIcon />}
                            className="confim-btn"
                            onClick={handleSave}
                        />
                        <Button
                            style={{
                                backgroundColor: '#ff0004',
                                borderColor: '#ff0004',
                                color: 'black',
                            }}
                            shape="circle"
                            icon={<CloseIcon />}
                            className="close-btn"
                            onClick={handleCancel}
                        />
                    </>
                )}

                <div className="profile-header">
                    <Avatar
                        className={editing ? 'profile-avatar-editing' : 'profile-avatar'}
                        src={editing ? avatarUrl : user.avatarUrl}
                        alt={user.username}
                        onClick={editing ? () => handleUpload(setAvatarUrl) : () => {}}
                    />
                    <div className="profile-info">
                        {editing ? (
                            <>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Full Name"
                                    style={{ marginBottom: '8px' }}
                                />
                                <Input.TextArea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Description"
                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                    style={{ marginBottom: '8px' }}
                                />
                            </>
                        ) : (
                            <>
                                <h1 className="profile-name">{user.fullName}</h1>
                                <span onClick={handleCopy} className="profile-username">
                                    @{user.username}
                                </span>
                                <p className="profile-description">
                                    <FormatQuoteIcon />
                                    {user.description}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
