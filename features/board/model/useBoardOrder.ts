'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { arrayMove } from '@dnd-kit/sortable';
import { useBoards } from '@/entities/board/model/useBoards';
import { userApi } from '@/entities/user/api/userApi';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

/** Sortable id of a board; also the key stored in `feedTabOrder`. */
export const boardKey = (boardId: number) => `board:${boardId}`;

/**
 * The user's boards in their saved order (shared by the home feed tabs and the
 * profile's Saved tab), plus `reorder` that saves a drag to the account.
 */
export function useBoardOrder() {
    const { user, setUser } = useSessionUser();
    const boards = useBoards();

    const ordered = useMemo(() => {
        const all = boards.data ?? [];
        // Saved order first (skipping deleted boards), then boards that are new since.
        const byKey = new Map(all.map((board) => [boardKey(board.id), board]));
        const saved = (user?.feedTabOrder ?? []).filter((key) => byKey.has(key));
        const rest = all.filter((board) => !saved.includes(boardKey(board.id)));

        return [...saved.map((key) => byKey.get(key)!), ...rest];
    }, [boards.data, user?.feedTabOrder]);

    const save = useMutation({
        mutationFn: (order: string[]) => userApi.setFeedTabOrder(order),
        onMutate: (order) => {
            const previous = user?.feedTabOrder ?? [];
            setUser((current) => (current ? { ...current, feedTabOrder: order } : current));
            return { previous };
        },
        onError: async (error, _, context) => {
            setUser((current) =>
                current ? { ...current, feedTabOrder: context?.previous ?? [] } : current,
            );
            toast.error(await getApiErrorMessage(error));
        },
    });

    const keys = ordered.map((board) => boardKey(board.id));

    /** Moves the board with sortable id `from` to where `to` is. */
    const reorder = (from: string, to: string) => {
        const fromIndex = keys.indexOf(from);
        const toIndex = keys.indexOf(to);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

        save.mutate(arrayMove(keys, fromIndex, toIndex));
    };

    return { boards: ordered, keys, isPending: boards.isPending, reorder };
}
