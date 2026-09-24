'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { chatApi } from '@/entities/chat/api/chatApi';
import type { UserPreview } from '@/entities/user/model/types';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { getMutePlaceholder } from '@/entities/user/lib/restrictions';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import styles from './index.module.css';

type FirstMessageDialogProps = {
    open: boolean;
    recipient: UserPreview;
    onClose: () => void;
};

export function FirstMessageDialog({ open, recipient, onClose }: FirstMessageDialogProps) {
    const router = useRouter();
    const { user } = useSessionUser();
    const [message, setMessage] = useState('');

    const restriction = user?.restrictions.messenger;
    const muted = Boolean(restriction?.muted);

    const send = useMutation({
        mutationFn: () => chatApi.start(recipient.id, message),
        onSuccess: ({ chatId }) => {
            setMessage('');
            onClose();
            router.push(`/chats/${chatId}`);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <Dialog open={open} onClose={send.isPending ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle className={styles.title}>
                <Avatar
                    src={recipient.avatarUrl}
                    alt={recipient.username}
                    className={styles.avatar}
                />
                Send your first message to {recipient.username}
            </DialogTitle>

            <DialogContent>
                <CountedTextField
                    value={message}
                    onChange={setMessage}
                    maxLength={DIRECT_MESSAGE_MAX_LENGTH}
                    placeholder={getMutePlaceholder(restriction, 'messenger', 'Write your message')}
                    disabled={muted}
                    multiline
                    minRows={2}
                    maxRows={12}
                    fullWidth
                    autoFocus
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={send.isPending}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => send.mutate()}
                    disabled={muted || !message.trim() || send.isPending}
                >
                    Send
                </Button>
            </DialogActions>
        </Dialog>
    );
}
