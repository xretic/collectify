import 'server-only';
import { db } from '@/shared/server/db';
import { notFound } from '@/shared/server/http';
import type { Board } from '../model/types';

const COVERS = 3;

export const boardSelect = {
    id: true,
    name: true,
    _count: { select: { collections: { where: { collection: { private: false } } } } },
    collections: {
        where: { collection: { private: false } },
        orderBy: { createdAt: 'desc' },
        take: COVERS,
        select: { collection: { select: { bannerUrl: true } } },
    },
} as const;

type BoardRow = {
    id: number;
    name: string;
    _count: { collections: number };
    collections: { collection: { bannerUrl: string } }[];
};

export const toBoard = (row: BoardRow): Board => ({
    id: row.id,
    name: row.name,
    collections: row._count.collections,
    covers: row.collections.map(({ collection }) => collection.bannerUrl),
});

export async function listBoards(userId: number): Promise<Board[]> {
    const rows = await db.board.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: boardSelect,
    });

    return rows.map(toBoard);
}

/** 404 unless the board exists and belongs to the user (boards are private). */
export async function getOwnedBoard(boardId: number, userId: number) {
    const board = await db.board.findUnique({
        where: { id: boardId },
        select: { id: true, userId: true },
    });

    if (!board || board.userId !== userId) throw notFound('Board not found.');

    return board;
}
