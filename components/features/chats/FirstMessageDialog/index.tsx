'use client';

import { Dialog, DialogContent, DialogTitle, DialogActions, Button, Avatar } from '@mui/material';
import { ConfigProvider, Input } from 'antd';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/lib/constans';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { api } from '@/lib/api';
import { UserInResponse } from '@/types/UserInResponse';
import { useFirstMessageDialogStore } from '@/stores/dialogs/firstMessageDialogStore';
import TextArea from 'antd/es/input/TextArea';

export default function FirstMessageDialog({ user }: { user: UserInResponse }) {
    const router = useRouter();
    const { open, setOpen } = useFirstMessageDialogStore();
    const { startLoading, stopLoading, loadingCount } = useUIStore();

    const [message, setMessage] = useState('');

    const handleClose = () => {
        setMessage('');
        setOpen(false);
    };

    const handleConfirm = async () => {
        if (loadingCount > 0) return;

        startLoading();

        try {
            const data = await api
                .post('api/chats/' + user.id + '/create', {
                    json: {
                        message,
                    },
                })
                .json<{ id: number }>();

            handleClose();
            router.replace('/chats/' + data.id);
        } catch {
            return;
        } finally {
            stopLoading();
        }
    };

    return (
        <Dialog
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: 'var(--container-color)',
                        color: 'var(--text-color)',
                        borderRadius: 3,
                    },
                },
            }}
            open={open}
            onClose={handleClose}
        >
            <DialogTitle sx={{ color: 'var(--text-color)' }} className="flex gap-2 mb-5">
                <Avatar src={user.avatarUrl} alt={user.username} sx={{ width: 35, height: 35 }} />
                Send your first message to {user.username}
            </DialogTitle>
            <DialogContent>
                <ConfigProvider
                    theme={{
                        token: {
                            colorTextPlaceholder: 'var(--soft-text)',
                            colorIcon: 'var(--soft-text)',
                        },
                    }}
                >
                    <TextArea
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write your message"
                        maxLength={DIRECT_MESSAGE_MAX_LENGTH}
                        style={{
                            backgroundColor: 'var(--container-color)',
                            color: 'var(--text-color)',
                        }}
                        autoSize={{ minRows: 2, maxRows: 30 }}
                        showCount
                    />
                </ConfigProvider>
            </DialogContent>

            <DialogActions>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClose}
                    sx={{ marginTop: 3, borderRadius: 6, textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleConfirm}
                    disabled={!message.trim()}
                    sx={{
                        marginTop: 3,
                        borderRadius: 6,
                        textTransform: 'none',
                    }}
                >
                    Send
                </Button>
            </DialogActions>
        </Dialog>
    );
}
