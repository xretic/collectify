import { notFound, route } from '@/shared/server/http';

/** Unknown API paths answer with a JSON 404 instead of the HTML not-found page. */
const handler = route<{ path: string[] }>(async () => {
    throw notFound();
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
