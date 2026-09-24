'use client';

import { useState, type KeyboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IconButton, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { chatApi } from '@/entities/chat/api/chatApi';
import type { ChatMessage } from '@/entities/chat/model/types';
import type { UserRestriction } from '@/entities/user/model/types';
import { getMutePlaceholder } from '@/entities/user/lib/restrictions';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';

type MessageComposerProps = {
    chatId: number;
    restriction: UserRestriction;
    disabled?: boolean;
    onSent: (message: ChatMessage) => void;
};

export function MessageComposer({
    chatId,
    restriction,
    disabled = false,
    onSent,
}: MessageComposerProps) {
    const [text, setText] = useState('');
    const blocked = disabled || restriction.muted;

    const send = useMutation({
        mutationFn: (content: string) => chatApi.send(chatId, content),
        onSuccess: (message) => {
            setText('');
            onSent(message);
        },
        // The draft stays in the input so nothing is lost on failure.
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const submit = () => {
        const content = text.trim();
        if (!content || blocked || send.isPending) return;
        send.mutate(content);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    };

    return (
        <footer className={styles.composer}>
            <TextField
                value={restriction.muted ? '' : text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getMutePlaceholder(restriction, 'messenger', 'Write your message')}
                disabled={blocked}
                multiline
                maxRows={10}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { maxLength: DIRECT_MESSAGE_MAX_LENGTH } }}
            />

            <IconButton
                color="primary"
                onClick={submit}
                disabled={blocked || !text.trim() || send.isPending}
                aria-label="Send message"
            >
                <SendIcon />
            </IconButton>
        </footer>
    );
}
