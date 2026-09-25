'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('collection.delete');
    const tc = useTranslations('common');
    const router = useRouter();
    const queryClient = useQueryClient();

    const remove = useMutation({
        mutationFn: () => collectionApi.delete(collectionId),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: collectionQueryKeys.detail(collectionId) });
            queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
            toast.success(t('deleted'));
            router.replace(asModerator ? '/' : '/collections/my');
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <ConfirmDialog
            open={open}
            title={t('title', { name })}
            description={t('description')}
            confirmLabel={tc('delete')}
            destructive
            pending={remove.isPending}
            onClose={onClose}
            onConfirm={() => remove.mutate()}
        />
    );
}
