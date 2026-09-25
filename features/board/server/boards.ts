import 'server-only';
import { db, isNotFound, isUniqueViolation } from '@/shared/server/db';
import { conflict, forbidden } from '@/shared/server/http';
import { BOARDS_PER_USER_LIMIT } from '@/shared/lib/constants';
import { boardSelect, getOwnedBoard, toBoard } from '@/entities/board/server/queries';
import { engage } from '@/features/collection/server/engagement';

function duplicateName(error: unknown): never {
    if (isUniqueViolation(error)) throw conflict('You already have a board with this name.');
    throw error;
}

export async function createBoard(userId: number, name: string) {
    const count = await db.board.count({ where: { userId } });
    if (count >= BOARDS_PER_USER_LIMIT) {
        throw forbidden(`You can have at most ${BOARDS_PER_USER_LIMIT} boards.`);
    }

    const board = await db.board
        .create({ data: { userId, name }, select: boardSelect })
        .catch(duplicateName);

    return toBoard(board);
}

export async function renameBoard(userId: number, boardId: number, name: string) {
    await getOwnedBoard(boardId, userId);

    const board = await db.board
        .update({ where: { id: boardId }, data: { name }, select: boardSelect })
        .catch(duplicateName);

    return toBoard(board);
}

export async function deleteBoard(userId: number, boardId: number) {
    await getOwnedBoard(boardId, userId);
    await db.board.delete({ where: { id: boardId } }).catch((error) => {
        if (!isNotFound(error)) throw error;
    });
}

/** Putting a collection on a board also saves it to favorites ("All"). */
export async function saveToBoard(userId: number, boardId: number, collectionId: number) {
    await getOwnedBoard(boardId, userId);
    await engage('FAVORITE', collectionId, userId);

    await db.boardCollection.upsert({
        where: { boardId_collectionId: { boardId, collectionId } },
        update: {},
        create: { boardId, collectionId },
    });
    await db.board.update({ where: { id: boardId }, data: { updatedAt: new Date() } });
}

export async function removeFromBoard(userId: number, boardId: number, collectionId: number) {
    await getOwnedBoard(boardId, userId);
    await db.boardCollection.deleteMany({ where: { boardId, collectionId } });
}
