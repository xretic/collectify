import { NextResponse } from 'next/server';
import { readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { setLocaleCookie } from '@/shared/server/locale';
import { getViewer } from '@/features/auth/server/guards';
import { setLocaleSchema } from '@/features/auth/model/schemas';
import { updateLocale } from '@/features/user/server/profile';

/** Switches the UI language; signed-in users also keep it on their account. */
export const PUT = route(async (req) => {
    const viewer = await getViewer(req);
    await enforceRateLimit(req, 'mutation', viewer?.userId);

    const { locale } = await readBody(req, setLocaleSchema);
    // An admin browsing as someone else must not change that person's language.
    if (viewer && !viewer.session.impersonatorUserId) await updateLocale(viewer.userId, locale);

    const res = new NextResponse(null, { status: 204 });
    setLocaleCookie(res, locale);

    return res;
});
