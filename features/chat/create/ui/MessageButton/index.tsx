'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconButton, Tooltip } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { chatApi } from '@/entities/chat/api/chatApi';
import type { UserPreview } from '@/entities/user/model/types';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { FirstMessageDialog } from '../FirstMessageDialog';

/** Opens the existing chat with `recipient`, or a dialog to start one. */
export function MessageButton({
    recipient,
    disabled,
}: {
    recipient: UserPreview;
    disabled?: boolean;
}) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleClick = async () => {
        setPending(true);

        try {
            const chatId = await chatApi.findWith(recipient.id);

            if (chatId) router.push(`/chats/${chatId}`);
            else setDialogOpen(true);
        } catch (error) {
            toast.error(await getApiErrorMessage(error));
        } finally {
            setPending(false);
        }
    };

    return (
        <>
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

            <FirstMessageDialog
                open={dialogOpen}
                recipient={recipient}
                onClose={() => setDialogOpen(false)}
            />
        </>
    );
}
