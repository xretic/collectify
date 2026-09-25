import { api } from '@/shared/api/api';
import type { Board } from '../model/types';

export const boardApi = {
    async list() {
        return (await api.get('boards').json<{ boards: Board[] }>()).boards;
    },

    async create(name: string) {
        return (await api.post('boards', { json: { name } }).json<{ board: Board }>()).board;
    },

    async rename(boardId: number, name: string) {
        return (await api.patch(`boards/${boardId}`, { json: { name } }).json<{ board: Board }>())
            .board;
    },

    async delete(boardId: number) {
        await api.delete(`boards/${boardId}`);
    },

    async setSaved(boardId: number, collectionId: number, saved: boolean) {
        const path = `boards/${boardId}/collections/${collectionId}`;
        await (saved ? api.put(path) : api.delete(path));
    },
};
