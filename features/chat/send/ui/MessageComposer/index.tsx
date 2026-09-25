'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IconButton, InputBase } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import type { ChatMessage } from '@/entities/chat/model/types';
import type { UserRestriction } from '@/entities/user/model/types';
import { getMutePlaceholder } from '@/entities/user/lib/restrictions';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/shared/lib/constants';
import { useTypeToFocus } from '@/shared/lib/hooks/useTypeToFocus';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';

type MessageComposerProps = {
    /** Delivers the message: to an existing chat, or starts one (draft chat). */
    sendMessage: (content: string) => Promise<ChatMessage>;
    restriction: UserRestriction;
    disabled?: boolean;
    onSent?: (message: ChatMessage) => void;
    /** Called while the user types, at most once per `TYPING_PING_MS`. */
    onTyping?: () => void;
};

/** Must stay below the receiver's timeout so the indicator does not flicker. */
const TYPING_PING_MS = 1_000;

export function MessageComposer({
    sendMessage,
    restriction,
    disabled = false,
    onSent,
    onTyping,
}: MessageComposerProps) {
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const lastTypingPingRef = useRef(0);
    const blocked = disabled || restriction.muted;

    useTypeToFocus(inputRef, !blocked);

    const send = useMutation({
        mutationFn: sendMessage,
        onSuccess: (message) => {
            setText('');
            lastTypingPingRef.current = 0;
            onSent?.(message);
        },
        // The draft stays in the input so nothing is lost on failure.
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const canSend = !blocked && !send.isPending && text.trim().length > 0;

    const submit = () => {
        if (canSend) send.mutate(text.trim());
    };

    const handleChange = (value: string) => {
        setText(value);

        const now = Date.now();
        if (onTyping && value.trim() && now - lastTypingPingRef.current >= TYPING_PING_MS) {
            lastTypingPingRef.current = now;
            onTyping();
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
        }
    };

    return (
        <form
            className={styles.composer}
            onSubmit={(event) => {
                event.preventDefault();
                submit();
            }}
        >
            <div className={`${styles.field} ${blocked ? styles.fieldDisabled : ''}`}>
                <InputBase
                    inputRef={inputRef}
                    value={restriction.muted ? '' : text}
                    onChange={(event) => handleChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={getMutePlaceholder(
                        restriction,
                        'messenger',
                        'Write your message…',
                    )}
                    disabled={blocked}
                    multiline
                    maxRows={6}
                    fullWidth
                    className={styles.input}
                    inputProps={{
                        maxLength: DIRECT_MESSAGE_MAX_LENGTH,
                        enterKeyHint: 'send',
                        'aria-label': 'Message',
                    }}
                />
            </div>

            <IconButton
                type="submit"
                className={styles.send}
                disabled={!canSend}
                aria-label="Send message"
                // Keeps the input (and the phone keyboard) focused.
                onPointerDown={(event) => event.preventDefault()}
            >
                <SendRoundedIcon fontSize="small" />
            </IconButton>
        </form>
    );
}
