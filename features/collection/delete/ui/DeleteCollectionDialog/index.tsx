'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

type DeleteCollectionDialogProps = {
    open: boolean;
    onClose: () => void;
    collectionId: number;
    name: string;
    /** Staff deleting someone else's collection. */
    asModerator?: boolean;
};

export function DeleteCollectionDialog({
    open,
    onClose,
    collectionId,
    name,
    asModerator = false,
}: DeleteCollectionDialogProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

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

    return (
        <ConfirmDialog
            open={open}
            title={`Delete “${name}”?`}
            description="This action cannot be undone. All items and comments will be deleted too."
            confirmLabel="Delete"
            destructive
            pending={remove.isPending}
            onClose={onClose}
            onConfirm={() => remove.mutate()}
        />
    );
}
