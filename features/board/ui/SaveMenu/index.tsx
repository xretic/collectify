'use client';

import { useState, type FormEvent, type MouseEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Checkbox, Divider, IconButton, InputBase, Popover } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import { boardApi } from '@/entities/board/api/boardApi';
import { boardQueryKeys } from '@/entities/board/model/queryKeys';
import { boardNameSchema } from '@/entities/board/model/schemas';
import { useBoards } from '@/entities/board/model/useBoards';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';
import { BOARD_NAME_MAX_LENGTH } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { useBoardMutations } from '../../model/useBoardMutations';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';

type SaveMenuProps = {
    collection: CollectionDetails;
    disabled: boolean;
};

/**
 * "Save" button: saves to favorites ("All saved") and lets the user put the
 * collection on any of their boards, or create a board on the spot.
 */
export function SaveMenu({ collection, disabled }: SaveMenuProps) {
    const t = useTranslations('boards');
    const format = useFormatters();
    const queryClient = useQueryClient();
    const cache = useCollectionCache(collection.id);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [newName, setNewName] = useState('');
    const boards = useBoards(anchorEl !== null);
    const { create } = useBoardMutations();

    const onChanged = () => {
        cache.invalidateLists();
        queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
    };

    const showError = async (error: unknown) => {
        toast.error(await getApiErrorMessage(error));
        queryClient.invalidateQueries({ queryKey: cache.key });
    };

    const setFavorited = useMutation({
        mutationFn: (value: boolean) => collectionApi.setFavorited(collection.id, value),
        onMutate: (value) =>
            cache.update((current) => ({
                ...current,
                favorited: value,
                favorites: Math.max(0, current.favorites + (value ? 1 : -1)),
                // Unsaving takes the collection off every board.
                boardIds: value ? current.boardIds : [],
            })),
        onSuccess: onChanged,
        onError: showError,
    });

    const setOnBoard = useMutation({
        mutationFn: ({ boardId, value }: { boardId: number; value: boolean }) =>
            boardApi.setSaved(boardId, collection.id, value),
        onMutate: ({ boardId, value }) =>
            cache.update((current) => ({
                ...current,
                boardIds: value
                    ? [...current.boardIds, boardId]
                    : current.boardIds.filter((id) => id !== boardId),
                // Saving to a board also saves to "All".
                favorited: value || current.favorited,
                favorites: value && !current.favorited ? current.favorites + 1 : current.favorites,
            })),
        onSuccess: onChanged,
        onError: showError,
    });

    const open = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        // First click saves right away, like Pinterest; the menu refines where.
        if (!collection.favorited) setFavorited.mutate(true);
    };

    const parsedName = boardNameSchema.safeParse(newName);

    const createBoard = (event: FormEvent) => {
        event.preventDefault();
        if (!parsedName.success) return;

        create.mutate(parsedName.data, {
            onSuccess: (board) => {
                setNewName('');
                setOnBoard.mutate({ boardId: board.id, value: true });
            },
        });
    };

    return (
        <>
            <button
                type="button"
                className={`${styles.trigger} ${collection.favorited ? styles.active : ''}`}
                disabled={disabled}
                onClick={open}
                aria-haspopup="dialog"
                title={disabled ? t('signInToSave') : undefined}
            >
                {collection.favorited ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                <span>{collection.favorited ? t('saved') : t('save')}</span>
                <span className={styles.count}>{format.compact(collection.favorites)}</span>
            </button>

            <Popover
                open={anchorEl !== null}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                classes={{ paper: styles.popover }}
            >
                <h3 className={styles.title}>{t('saveTo')}</h3>

                <label className={styles.row}>
                    <span className={`${styles.cover} ${styles.allCover}`}>
                        <BookmarkIcon fontSize="small" />
                    </span>
                    <span className={styles.name}>{t('allSaved')}</span>
                    <Checkbox
                        checked={collection.favorited}
                        onChange={(event) => setFavorited.mutate(event.target.checked)}
                    />
                </label>

                <Divider className={styles.divider} />

                <div className={styles.boards}>
                    {boards.data?.map((board) => {
                        const checked = collection.boardIds.includes(board.id);

                        return (
                            <label key={board.id} className={styles.row}>
                                {board.covers[0] ? (
                                    <img className={styles.cover} src={board.covers[0]} alt="" />
                                ) : (
                                    <span className={styles.cover}>
                                        <DashboardCustomizeOutlinedIcon fontSize="small" />
                                    </span>
                                )}
                                <span className={styles.name}>{board.name}</span>
                                <Checkbox
                                    checked={checked}
                                    onChange={(event) =>
                                        setOnBoard.mutate({
                                            boardId: board.id,
                                            value: event.target.checked,
                                        })
                                    }
                                />
                            </label>
                        );
                    })}

                    {boards.data?.length === 0 && <p className={styles.hint}>{t('hint')}</p>}
                </div>

                <form className={styles.create} onSubmit={createBoard}>
                    <InputBase
                        className={styles.input}
                        placeholder={t('newName')}
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        inputProps={{
                            maxLength: BOARD_NAME_MAX_LENGTH,
                            'aria-label': t('newName'),
                        }}
                    />
                    <IconButton
                        type="submit"
                        color="primary"
                        disabled={!parsedName.success || create.isPending}
                        aria-label={t('create')}
                    >
                        <AddIcon />
                    </IconButton>
                </form>
            </Popover>
        </>
    );
}
