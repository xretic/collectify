'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { managementQueryKeys } from './queryKeys';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

/** Moderation action that refreshes every management view once it succeeds. */
export function useModerationMutation<TVariables, TResult>(
    mutationFn: (variables: TVariables) => Promise<TResult>,
    successMessage?: string | ((result: TResult) => string),
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: managementQueryKeys.all });
            if (successMessage) {
                toast.success(
                    typeof successMessage === 'function' ? successMessage(result) : successMessage,
                );
            }
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });
}
