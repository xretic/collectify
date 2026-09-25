'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Avatar, Button } from '@mui/material';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import type { CollectionComment } from '@/entities/comment/model/types';
import type { SessionUser } from '@/entities/user/model/types';
import { getMutePlaceholder } from '@/entities/user/lib/restrictions';
import { COMMENT_MAX_LENGTH } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import { useCommentCache } from '../../../model/useCommentCache';
import styles from './index.module.css';

type CommentComposerProps = {
    collectionId: number;
    viewer: SessionUser;
    /** Answering this comment (inline reply box). */
    replyTo?: CollectionComment;
    onDone?: () => void;
};

export function CommentComposer({ collectionId, viewer, replyTo, onDone }: CommentComposerProps) {
    const cache = useCommentCache(collectionId);
    const restriction = viewer.restrictions.comments;
    const [text, setText] = useState('');
    const [focused, setFocused] = useState(Boolean(replyTo));

    const send = useMutation({
        mutationFn: () => collectionApi.addComment(collectionId, text.trim(), replyTo?.id),
        onSuccess: (comment) => {
            // The text is cleared only after success, so a failed send keeps the draft.
            setText('');
            cache.add(comment);
            onDone?.();
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const cancel = () => {
        setText('');
        setFocused(false);
        onDone?.();
    };

    const placeholder = replyTo ? `Reply to @${replyTo.author.username}` : 'Add a comment…';

    return (
        <div className={`${styles.composer} ${replyTo ? styles.reply : ''}`}>
            <Avatar className={styles.avatar} src={viewer.avatarUrl} alt={viewer.username} />

            <div className={styles.body}>
                <CountedTextField
                    value={restriction.muted ? '' : text}
                    onChange={setText}
                    onFocus={() => setFocused(true)}
                    maxLength={COMMENT_MAX_LENGTH}
                    placeholder={getMutePlaceholder(restriction, 'comments', placeholder)}
                    disabled={restriction.muted}
                    variant="standard"
                    multiline
                    minRows={1}
                    maxRows={12}
                    fullWidth
                    autoFocus={Boolean(replyTo)}
                />

                {focused && !restriction.muted && (
                    <div className={styles.actions}>
                        <Button size="small" onClick={cancel} disabled={send.isPending}>
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => send.mutate()}
                            disabled={!text.trim() || send.isPending}
                        >
                            {replyTo ? 'Reply' : 'Comment'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
