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
    const [username, setUserName] = useState('');
    const [description, setDescription] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    if (loading) return null;
    if (!user) return;

    const handleEdit = () => {
        setFullName(user.fullName);
        setDescription(user.description);
        setBannerUrl(user.bannerUrl);
        setAvatarUrl(user.avatarUrl);
        setUserName(user.username);
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
        const res = await fetch('/api/users/' + user.id, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullName,
                description,
                username,
                bannerUrl,
                avatarUrl,
            }),
        });

        if (res.status === 409) {
            setErrorMessage('User with this username already exists.');
            setTimeout(() => setErrorMessage(''), 2000);
            return;
        }

        if (!res.ok) return;

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

            {errorMessage.length > 0 && (
                <div className={`toast ${errorMessage.length > 0 ? 'show' : ''}`}>
                    <Alert severity="error" variant="filled">
                        {errorMessage}
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
                                backgroundColor: '#74f878',
                                borderColor: '#74f878',
                                color: 'black',
                            }}
                            shape="circle"
                            icon={<CheckIcon />}
                            className="confim-btn"
                            onClick={handleSave}
                            disabled={
                                !fullName.trim() ||
                                !username.trim() ||
                                !isUsernameValid(username) ||
                                fullName.length > 30 ||
                                description.length > 100
                            }
                        />
                        <Button
                            style={{
                                backgroundColor: '#f55b5d',
                                borderColor: '#f55b5d',
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
                                <Input
                                    value={username}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="@username"
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
                                    {description.length === 0 ? 'No bio yet' : description}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}

const isUsernameValid = (username: string): boolean => {
    if (username.length > 18) return false;

    const regex = /^[a-zA-Z0-9_.]+$/;
    return regex.test(username);
};
