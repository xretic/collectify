import type { Prisma } from '@/generated/prisma/client';
import { forbidden, noContent, readBody, route } from '@/shared/server/http';
import { db } from '@/shared/server/db';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { appearanceSchema } from '@/shared/lib/validation/theme';
import { requireViewer } from '@/features/auth/server/guards';

/** Saves the theme in use and the user's custom themes, so every device gets them. */
export const PUT = route(async (req) => {
    const viewer = await requireViewer(req);
    // Staff signed in as a user must not restyle their account.
    if (viewer.session.impersonatorUserId) throw forbidden();
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const { theme, customThemes } = await readBody(req, appearanceSchema);
    await db.user.update({
        where: { id: viewer.userId },
        data: { theme, customThemes: customThemes as Prisma.InputJsonValue },
    });

    return noContent();
});
