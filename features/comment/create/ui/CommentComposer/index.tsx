'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';
import { commentQueryKeys } from '@/entities/comment/model/queryKeys';
import type { CommentsPage } from '@/entities/comment/model/types';
import type { UserRestriction } from '@/entities/user/model/types';
import { getMutePlaceholder } from '@/entities/user/lib/restrictions';
import { COMMENT_MAX_LENGTH } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import styles from './index.module.css';

type CommentComposerProps = {
    collectionId: number;
    restriction: UserRestriction;
};

export function CommentComposer({ collectionId, restriction }: CommentComposerProps) {
    const queryClient = useQueryClient();
    const collectionCache = useCollectionCache(collectionId);
    const [text, setText] = useState('');

    const send = useMutation({
        mutationFn: () => collectionApi.addComment(collectionId, text.trim()),
        onSuccess: (comment) => {
            // The text is cleared only after success, so a failed send keeps the draft.
            setText('');

            queryClient.setQueryData<InfiniteData<CommentsPage>>(
                commentQueryKeys.byCollection(collectionId),
                (data) =>
                    data && {
                        ...data,
                        pages: data.pages.map((page, index) =>
                            index === 0
                                ? { ...page, total: page.total + 1, data: [comment, ...page.data] }
                                : page,
                        ),
                    },
            );

            collectionCache.update((collection) => ({
                ...collection,
                comments: collection.comments + 1,
            }));
            collectionCache.invalidateLists();
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <div className={styles.composer}>
            <CountedTextField
                value={restriction.muted ? '' : text}
                onChange={setText}
                maxLength={COMMENT_MAX_LENGTH}
                placeholder={getMutePlaceholder(restriction, 'comments', 'Write your comment')}
                disabled={restriction.muted}
                multiline
                minRows={2}
                maxRows={20}
                fullWidth
            />

            <Button
                variant="contained"
                className={styles.send}
                onClick={() => send.mutate()}
                disabled={restriction.muted || !text.trim() || send.isPending}
            >
                Send
            </Button>
        </div>
    );
}
