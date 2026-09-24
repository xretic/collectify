import { z } from 'zod';

/** Positive Postgres INT4 id (also accepts numeric strings from query params). */
export const idSchema = z.coerce.number().int().positive().max(2_147_483_647);
