'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconButton, Tooltip } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

type DeleteCollectionButtonProps = {
    collectionId: number;
    name: string;
    /** Staff deleting someone else's collection. */
    asModerator?: boolean;
};

export function DeleteCollectionButton({
    collectionId,
    name,
    asModerator = false,
}: DeleteCollectionButtonProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [confirming, setConfirming] = useState(false);

    const remove = useMutation({
        mutationFn: () => collectionApi.delete(collectionId),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: collectionQueryKeys.detail(collectionId) });
            queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
            toast.success('Collection deleted.');
            router.replace(asModerator ? '/' : '/collections/my');
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const label = asModerator ? 'Delete as moderator' : 'Delete collection';

    return (
        <>
            <Tooltip title={label}>
                <IconButton color="error" onClick={() => setConfirming(true)} aria-label={label}>
                    <DeleteOutlineOutlinedIcon />
                </IconButton>
            </Tooltip>

            <ConfirmDialog
                open={confirming}
                title={`Delete “${name}”?`}
                description="This action cannot be undone. All items and comments will be deleted too."
                confirmLabel="Delete"
                destructive
                pending={remove.isPending}
                onClose={() => setConfirming(false)}
                onConfirm={() => remove.mutate()}
            />
        </>
    );
}
