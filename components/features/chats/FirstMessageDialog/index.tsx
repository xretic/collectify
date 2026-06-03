'use client';

import { Dialog, DialogContent, DialogTitle, DialogActions, Button, Avatar } from '@mui/material';
import { ConfigProvider } from 'antd';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/lib/constans';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUIStore } from '@/shared/model/uiStore';
import { UserInResponse } from '@/types/UserInResponse';
import { useFirstMessageDialogStore } from '@/features/chat/create/model/firstMessageDialogStore';
import TextArea from 'antd/es/input/TextArea';
import { chatApi } from '@/entities/chat/api/chatApi';
import { useUser } from '@/context/UserProvider';
import { getMutePlaceholder } from '@/lib/restrictions';

export default function FirstMessageDialog({ user: targetUser }: { user: UserInResponse }) {
    const router = useRouter();
    const { open, setOpen } = useFirstMessageDialogStore();
    const { startLoading, stopLoading, loadingCount } = useUIStore();
    const { user } = useUser();

    const [message, setMessage] = useState('');
    const messengerRestriction = user?.restrictions.messenger;
    const messengerMuted = !!messengerRestriction?.muted;
    const messagePlaceholder = getMutePlaceholder(
        messengerRestriction,
        'messenger',
        'Write your message',
    );

    const handleClose = () => {
        setMessage('');
        setOpen(false);
    };

    const handleConfirm = async () => {
        if (loadingCount > 0 || messengerMuted) return;

        startLoading();

        try {
            const data = await chatApi.create(targetUser.id, message);

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
                <Avatar
                    src={targetUser.avatarUrl}
                    alt={targetUser.username}
                    sx={{ width: 35, height: 35 }}
                />
                Send your first message to {targetUser.username}
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
                        value={messengerMuted ? '' : message}
                        disabled={messengerMuted}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={messagePlaceholder}
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
                    disabled={messengerMuted || !message.trim()}
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
