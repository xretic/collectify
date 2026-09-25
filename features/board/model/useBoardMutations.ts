'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardApi } from '@/entities/board/api/boardApi';
import { boardQueryKeys } from '@/entities/board/model/queryKeys';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

const showError = async (error: unknown) => toast.error(await getApiErrorMessage(error));

export function useBoardMutations() {
    const queryClient = useQueryClient();

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
        queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
    };

    const create = useMutation({
        mutationFn: (name: string) => boardApi.create(name),
        onSuccess: refresh,
        onError: showError,
    });

    const rename = useMutation({
        mutationFn: ({ boardId, name }: { boardId: number; name: string }) =>
            boardApi.rename(boardId, name),
        onSuccess: refresh,
        onError: showError,
    });

    const remove = useMutation({
        mutationFn: (boardId: number) => boardApi.delete(boardId),
        onSuccess: refresh,
        onError: showError,
    });

    return { create, rename, remove };
}
