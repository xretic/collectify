'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconButton, Tooltip } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { chatApi } from '@/entities/chat/api/chatApi';
import type { UserPreview } from '@/entities/user/model/types';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

/** Opens the existing chat with `recipient`, or an empty draft one that the first message creates. */
export function MessageButton({
    recipient,
    disabled,
}: {
    recipient: UserPreview;
    disabled?: boolean;
}) {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    const handleClick = async () => {
        setPending(true);

        try {
            const { chatId } = await chatApi.findWith(recipient.id);
            router.push(chatId ? `/chats/${chatId}` : `/chats/new/${recipient.id}`);
        } catch (error) {
            toast.error(await getApiErrorMessage(error));
            setPending(false);
        }
    };

    return (
        <Tooltip title="Message">
            <span>
                <IconButton
                    color="inherit"
                    onClick={handleClick}
                    disabled={disabled || pending}
                    aria-label="Message"
                >
                    <EmailIcon />
                </IconButton>
            </span>
        </Tooltip>
    );
}
