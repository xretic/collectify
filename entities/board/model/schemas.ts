import { z } from 'zod';
import { BOARD_NAME_MAX_LENGTH } from '@/shared/lib/constants';

export const boardNameSchema = z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(1, 'Name is required.').max(BOARD_NAME_MAX_LENGTH));

export const boardSchema = z.object({ name: boardNameSchema });
